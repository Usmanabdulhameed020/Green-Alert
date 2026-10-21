# 👨‍💻 GreenAlert — Code-Level Technical Interview & Defense Guide

> **Targeted For:** Technical code inspectors, senior engineer interviewers, and technical internship evaluators who demand: *"Open your code editor, pick a file, and explain line-by-line how it works."*

---

## 🧭 The 4 Pillars Inspectors Test in Code Interviews

When a technical interviewer evaluates code for an internship, they are assessing:
1. **Mental Model:** Do you understand the asynchronous request-response lifecycle (Client ⇄ Network ⇄ Middleware ⇄ Controller ⇄ Database)?
2. **Security Awareness:** Do you understand token verification, password hashing, and IDOR access control?
3. **JavaScript / Node.js Fundamentals:** Do you understand closures, Promises (`async/await`), event loop handling, and buffer streaming?
4. **React Architecture:** Do you understand Context API, unidirectional data flow, side effects (`useEffect`), and interceptors?

---

## 🔬 Master Code Walkthroughs (The Top 5 Files Evaluators Inspect)

---

### File 1: Authentication Middleware (`server/src/middlewares/auth.middleware.js`)
*This is the most scrutinized file in any Node.js technical interview.*

```javascript
// Lines 5–35: auth.middleware.js
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check cookies first, fallback to HTTP Authorization Header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Guard clause: Reject early if no token provided
    if (!token) {
      return res.status(401).json({ success: false, message: 'You are not logged in! Please log in to get access.' });
    }

    // 3. Cryptographic signature verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Verify user still exists in database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'The user belonging to this token no longer exists.' });
    }

    // 5. Account state check (real-time suspension enforcement)
    if (currentUser.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
    }

    // 6. Context injection for downstream route handlers
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
```

#### How to Explain This File to the Inspector:
> *"Here in `protect`, we implement our stateless authentication guard using the Express middleware pattern.*
> - **Line 9–13:** *We support both `httpOnly` cookies and `Bearer` authorization headers, providing flexibility for SPA clients and mobile endpoints.*
> - **Line 19:** *`jwt.verify()` cryptographically validates the token payload against our server's `JWT_SECRET`. If an attacker tampers with a single character, it throws an error and falls into the `catch` block.*
> - **Line 21–28:** *Notice that we don't blindly trust the token. We query `User.findById(decoded.id)` to confirm the user hasn't been deleted or banned. This means if an Admin bans a user, their access is revoked immediately on their next request.*
> - **Line 30–31:** *We mutate `req` by injecting `req.user = currentUser`, and invoke `next()` to pass control to the controller. This keeps our controllers clean and decoupled from auth logic."*

---

### File 2: Agency Controller & IDOR Defense (`server/src/controllers/agency.controller.js`)
*Interviewers love asking: "How do you prevent Agency A from tampering with Agency B's tickets?"*

```javascript
// Lines 111–158: agency.controller.js
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['In Progress', 'Resolved', 'Closed'];

    // 1. Input Validation Guard
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'No organization linked to your account.' });
    }

    // 2. Fetch the target resource
    const report = await Report.findById(req.params.id).populate('user');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // 3. State machine rule: Once Closed, immutable
    if (report.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Cannot change status of a closed report' });
    }

    // 4. CRITICAL SECURITY GUARD: IDOR Mitigation
    if (!report.assignedTo || report.assignedTo.toString() !== orgId.toString()) {
      return res.status(403).json({ success: false, message: 'This report is not assigned to your agency' });
    }

    // 5. Apply state transitions and resolution metadata
    report.status = status;
    if (Array.isArray(req.body.resolutionImages)) {
      report.resolutionImages = req.body.resolutionImages;
    }
    if (req.body.resolutionNotes) {
      report.resolutionNotes = req.body.resolutionNotes;
    }
    if (status === 'Resolved' || status === 'Closed') {
      report.resolvedAt = new Date();
    }

    await report.save();
    return res.status(200).json(report);
  } catch (error) {
    console.error('Agency update report status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
```

#### How to Explain This File to the Inspector:
> *"In `updateReportStatus`, we enforce strict state-machine transitions and access controls.*
> - **Line 119:** *We validate incoming status values against an explicit whitelist (`['In Progress', 'Resolved', 'Closed']`), blocking unauthorized status jumps.*
> - **Line 134:** *We enforce business immutability: once a report is `Closed`, no further edits are permitted.*
> - **Line 138–140:** *This is our **IDOR (Insecure Direct Object Reference)** guard. Even if a malicious agency guesses a valid report ID, we cross-reference `report.assignedTo.toString()` with `req.user.organizationId.toString()`. If they do not match, we terminate the request with a `403 Forbidden`.*
> - **Line 149–151:** *When resolving, we atomically record the timestamp `resolvedAt` and attach resolution proof images, establishing full accountability."*

---

### File 3: In-Memory Upload & Media Pipeline (`server/src/routes/upload.routes.js`)
*Interviewers ask: "How do file uploads work? Why not write directly to local disk?"*

```javascript
// Lines 8–45: upload.routes.js
const upload = multer({
  storage: multer.memoryStorage(), // In-memory buffer
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  },
});

router.post('/', protect, upload.array('images', 5), async (req, res) => {
  // Parallel asynchronous upload to CDN using Promise.all
  const results = await Promise.all(
    req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'greenalert', resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        stream.end(file.buffer); // Write RAM buffer to CDN network socket
      });
    })
  );

  return res.status(200).json({
    success: true,
    data: { urls: results.map((r) => r.url) },
  });
});
```

#### How to Explain This File to the Inspector:
> *"Here we designed an asynchronous, ephemeral upload pipeline.*
> - **Why `multer.memoryStorage()` over `diskStorage()`?** *Writing files to the server's local disk introduces multiple problems: ephemeral containers (like Docker or Render) wipe local storage on reboot, and local files don't share across multiple scaled server instances. Memory storage holds the buffer just long enough to pipe it.*
> - **Line 27–45:** *We leverage Node.js stream capabilities: `stream.end(file.buffer)` pushes the chunk directly over a TLS socket to Cloudinary CDN.*
> - **Line 27:** *`Promise.all` executes uploads concurrently rather than sequentially, cutting network latency down significantly when a citizen submits 5 photos at once.*
> - **Security:** *We enforce both file-size limits (20MB) and MIME-type validation to prevent arbitrary executable file uploads."*

---

### File 4: React State & Axios Interceptor (`client/src/contexts/CitizenContext.jsx`)
*Interviewers ask: "How does the frontend stay synchronized with authentication and handle tokens?"*

```javascript
// Lines 9–16: CitizenContext.jsx
// Global Axios Interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('greenalert_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lines 46–82: Token Hydration & Profile Verification on Boot
useEffect(() => {
  const verifyAuth = async () => {
    const storedToken = localStorage.getItem('greenalert_token');
    if (!storedToken) {
      setUser(null);
      setAuthInitialized(true);
      return;
    }

    try {
      // Validate token with backend /auth/me
      const res = await axios.get('/api/v1/auth/me');
      if (res.data?.success) {
        setUser(res.data.data.user);
      } else {
        localStorage.clear();
        setUser(null);
      }
    } catch {
      localStorage.clear();
      setUser(null);
    } finally {
      setAuthInitialized(true);
    }
  };

  verifyAuth();
}, []);
```

#### How to Explain This File to the Inspector:
> *"In `CitizenContext`, we manage our global client authentication state and HTTP pipeline.*
> - **Axios Interceptor (Lines 9–16):** *Instead of manually passing the `Authorization` header in dozens of individual fetch calls across the app, we utilize an Axios request interceptor. It acts as a client-side middleware, dynamically injecting the `Bearer <token>` into every outgoing request.*
> - **App Hydration & Verification (Lines 46–82):** *When the user reloads the browser, we don't just rely on cached `localStorage` data. We send a verification handshake to `/api/v1/auth/me`. If the user was banned or deleted on the backend, the token fails verification, `localStorage` is purged, and the user is securely returned to the login screen.*
> - **`authInitialized` Flag:** *This prevents race conditions or flickering unauthorized redirects before the initial auth check completes."*

---

### File 5: Password Hashing & Schema Defense (`server/src/models/User.js`)
*Interviewers ask: "How are passwords stored and compared?"*

```javascript
// Lines 23–28: Password Schema definition
password: {
  type: String,
  required: [true, 'Please provide a password'],
  minlength: 6,
  select: false, // Do not return password by default in queries
},

// Lines 68–76: Pre-save hook for salting & hashing
userSchema.pre('save', async function (next) {
  // Only hash if password field was modified (prevents double-hashing on profile updates)
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method for password verification
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

#### How to Explain This File to the Inspector:
> *"Security in `User.js` is implemented at the schema layer.*
> - **`select: false` (Line 27):** *By default, Mongoose excludes the password hash from all `find()` queries. This ensures that even if a developer writes `User.find()` or `populate('user')`, password hashes are never accidentally leaked to client-facing APIs.*
> - **`isModified('password')` (Line 70):** *This check prevents a classic bug where saving unrelated profile info (like updating a phone number) would inadvertently re-hash an already hashed password.*
> - **Salt Rounds (Line 72):** *We use 12 salt rounds with `bcryptjs`, balancing cryptographic resistance against brute-force attacks with efficient server CPU performance.*
> - **`comparePassword` (Instance Method):** *We encapsulate bcrypt comparison directly on the user model instance, keeping controllers clean."*

---

## ⚡ The Full Request Lifecycle (Tracing from Button Click to Database)

If the interviewer says: *"Pick one feature — say, a citizen submitting a report — and trace the request end-to-end through every file."*

Give them this exact 6-step walkthrough:

```
[React UI] CreateReport.jsx (handleSubmit)
    │
    ▼ (1)
[Axios Interceptor] CitizenContext.jsx (Attaches Bearer Token)
    │
    ▼ (2)
[Express Server Entry] app.js (CORS, JSON parser, Route matching)
    │
    ▼ (3)
[Auth Middleware] auth.middleware.js (protect: verifies JWT signature)
    │
    ▼ (4)
[Controller Logic] report.controller.js (createReport: schema validation)
    │
    ▼ (5)
[MongoDB Atlas] Report.js (Mongoose ODM creates document with default 'Submitted')
    │
    ▼ (6)
[HTTP 201 Response] JSON payload returned ──► React updates state & redirects to MyReports
```

1. **User interaction:** Citizen clicks "Submit" in `CreateReport.jsx`.
2. **Client Dispatch:** Axios dispatches `POST /api/v1/reports`. The interceptor in `CitizenContext.jsx` injects the JWT header.
3. **Server Entry:** In `app.js`, CORS validates the origin, and Express matches the `/api/v1/reports` route group in `report.routes.js`.
4. **Middleware Validation:** `protect` in `auth.middleware.js` decodes the token, loads the user, and sets `req.user`.
5. **Controller & Persistence:** In `report.controller.js`, `createReport` constructs the Mongoose document with coordinates and evidence URLs, persisting it to MongoDB Atlas.
6. **Client Re-render:** The controller returns `201 Created` with the JSON document. React receives the response, appends the new item to state, and renders the success state.

---

## 💬 6 Golden Phrases That Guarantee Internship Points

Sprinkle these phrases into your explanations — they signal professional software engineering habits:

| Concept | What to Say |
| :--- | :--- |
| **Why stateless JWT?** | *"Stateless tokens eliminate the need for centralized session storage on the server, allowing our API to scale horizontally across multiple instances."* |
| **Why Mongoose Schemas?** | *"Even though MongoDB is natively schema-less, Mongoose gives us compile-time schema validation and strict business constraints at the application layer."* |
| **Why not store binary images in DB?** | *"Base64 binaries bloat document size by 33% and exhaust MongoDB working RAM. We offload binaries to Cloudinary CDN and store only lightweight URI references."* |
| **Why optimistic UI vs strict awaits?** | *"For non-destructive interactions like saving bookmarks, we use optimistic UI updates for instant feedback, while critical actions like report assignment use strict awaits to guarantee data integrity."* |
| **How did you prevent memory leaks?** | *"We clean up event listeners in `useEffect` return functions and cancel active search debounce timers on component unmount."* |
| **Why Express 5?** | *"Express 5 provides native asynchronous error propagation, meaning unhandled rejected promises in async routes automatically flow to our central error handler without crashing the process."* |

---

## 🛑 What to Do When Asked a Code Question You Don't Know

If an interviewer asks: *"Why didn't you use Redis for rate limiting?"* or *"How would this handle 10,000 requests per second?"*

Follow this 3-step formula:

1. **Acknowledge the premise:** *"That's a great production scalability question."*
2. **Explain the current design trade-off:** *"For our current deployment, we optimized for maintainability and direct database transactions without introducing extra infrastructure overhead."*
3. **Explain how you would evolve it:** *"To scale to 10,000 req/sec, we would introduce a Redis caching layer for the Explore feed, implement connection pooling on MongoDB, and place an NGINX reverse proxy with rate limiting in front of our Node instances."*

---

> **Ready for the Interview:** Keep your editor open with `auth.middleware.js`, `agency.controller.js`, and `CitizenContext.jsx`. You know the architecture, you know the code locations, and you know the reasoning behind every design decision.
