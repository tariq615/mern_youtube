const asyncHandler = async (requestHandler) => {
  (req, res, next) => {
    // this is a middlewear and it contains the resposne of resolve or catch and return that to request handler
    Promise.resolve(requestHandler(req, res, next)) // it performs the route operation and send the response to resolve or catch.
      .catch((err) => next(err));
  };
};

export { asyncHandler };
