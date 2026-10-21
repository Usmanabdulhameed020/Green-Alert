/**
 * Simplified tilt card — mouse tracking removed since animations are disabled.
 * Children render inside a plain wrapper; onClick etc. pass through.
 */
export default function TiltCard({ children, className = '', ...rest }) {
  return (
    <div className={`relative ${className}`} {...rest}>
      {children}
    </div>
  );
}
