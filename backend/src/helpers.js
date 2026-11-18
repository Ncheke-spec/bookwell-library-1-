export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function validId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

export function isDuplicate(error) {
  return error?.code === 'ER_DUP_ENTRY';
}
