export function catchErrors(fn) {
  return (req, res, next) => {
    return fn(req, res, next).catch(next);
  };
};