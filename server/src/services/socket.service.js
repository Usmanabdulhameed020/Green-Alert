const logger = require('../utils/logger');
let io;

const typingUsers = new Map(); // roomId -> Map of userId -> {username, timeout}

const initSocketService = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // User joins their personal room
    socket.on('join-user', (userId) => {
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined room user:${userId}`);
    });

    // Agency joins their organization room
    socket.on('join-agency', (organizationId) => {
      socket.join(`agency:${organizationId}`);
      logger.info(`Agency joined room agency:${organizationId}`);
    });

    // Admin joins admin room
    socket.on('join-admin', () => {
      socket.join('admins');
      logger.info('Admin joined room admins');
    });

    // Join a specific report's room (for real-time comments)
    socket.on('join-report', (reportId) => {
      socket.join(`report:${reportId}`);
    });

    socket.on('leave-report', (reportId) => {
      socket.leave(`report:${reportId}`);
    });

    socket.on('user:start-typing', (data) => {
      startTyping(socket, data);
    });

    socket.on('user:stop-typing', (data) => {
      stopTyping(socket, data);
    });

    socket.on('get-typing-users', (data, callback) => {
      const users = getTypingUsers(data.roomId);
      callback(users);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

const emitReportAssigned = (report) => {
  if (!report.assignedTo) return;

  // Notify the agency
  if (report.assignedTo._id) {
    io?.to(`agency:${report.assignedTo._id}`).emit('report:assigned', report);
  }

  // Notify admins
  io?.to('admins').emit('report:assigned', report);

  // Notify the citizen who created the report
  if (report.user?._id) {
    io?.to(`user:${report.user._id}`).emit('report:assigned', report);
  }
};

const emitReportStatusChanged = (report) => {
  // Notify the citizen
  if (report.user?._id) {
    io?.to(`user:${report.user._id}`).emit('report:status-changed', report);
  }

  // Notify the assigned agency
  if (report.assignedTo?._id) {
    io?.to(`agency:${report.assignedTo._id}`).emit('report:status-changed', report);
  }

  // Notify admins
  io?.to('admins').emit('report:status-changed', report);
};

const emitNewReport = (report) => {
  // Notify admins of new report
  io?.to('admins').emit('report:new', report);
};

const emitReportComment = (reportId, comment) => {
  // Broadcast new comment to everyone in the report room
  io?.to(`report:${reportId}`).emit('report:comment-added', { reportId, comment });
};

const emitReportReply = (reportId, commentId, reply) => {
  // Broadcast new reply to everyone in the report room
  io?.to(`report:${reportId}`).emit('report:reply-added', { reportId, commentId, reply });
};

const emitNotification = (notification) => {
  if (!notification.user) return;
  const userId = notification.user._id || notification.user;
  io?.to(`user:${userId}`).emit('notification:new', notification);
};

const startTyping = (socket, data) => {
  const { roomId, userId, username } = data;
  if (!typingUsers.has(roomId)) typingUsers.set(roomId, new Map());
  const room = typingUsers.get(roomId);

  if (room.has(userId)) {
    clearTimeout(room.get(userId).timeout);
  }

  const timeout = setTimeout(() => {
    room.delete(userId);
    io?.to(roomId).emit('user:typing-stop', { userId, roomId });
  }, 3000);

  room.set(userId, { username, timeout });
  socket.to(roomId).emit('user:typing', { userId, username, roomId });
};

const stopTyping = (socket, data) => {
  const { roomId, userId } = data;
  if (!typingUsers.has(roomId)) return;
  const room = typingUsers.get(roomId);
  if (room.has(userId)) {
    clearTimeout(room.get(userId).timeout);
    room.delete(userId);
  }
  socket.to(roomId).emit('user:typing-stop', { userId, roomId });
};

const getTypingUsers = (roomId) => {
  if (!typingUsers.has(roomId)) return [];
  const room = typingUsers.get(roomId);
  return Array.from(room.entries()).map(([userId, data]) => ({ userId, username: data.username }));
};

module.exports = {
  initSocket: initSocketService,
  emitReportAssigned,
  emitReportStatusChanged,
  emitNewReport,
  emitReportComment,
  emitReportReply,
  emitNotification,
  startTyping,
  stopTyping,
  getTypingUsers,
};