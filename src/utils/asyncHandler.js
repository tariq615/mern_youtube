const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
    try {
      // Await the request handler execution directly
      await requestHandler(req, res, next);
    } catch (error) {
      // Pass any errors to the next middleware (i.e., Express error handler)
      next(error);
    }
  };
};

export { asyncHandler };
