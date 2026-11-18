export default function Notice({ error, success }) {
  if (!error && !success) return null;
  return <div className={error ? 'notice error-notice' : 'notice success-notice'} role="status">{error || success}</div>;
}
