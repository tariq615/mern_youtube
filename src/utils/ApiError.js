class ApiError extends Error {
  constructor(
    statusCode, // HTTP status code
    message = "something went wrong", // Default error message
    errors = [], // Additional error details (if any)
    stack = "" // Optional custom stack trace
  ) {
    super(message); // Call parent Error constructor with message
    this.statusCode = statusCode; // Store the status code
    this.data = null; // Initialize `data` property (not used yet)
    this.message = message; // Store the message
    this.success = false; // Set success to false for error responses
    this.errors = errors; // Store any extra error details

    if (stack) {
      // If stack trace is provided
      this.stack = stack; // Use the custom stack trace
    } else {
      // Otherwise
      Error.captureStackTrace(this, this.constructor); // Capture stack trace
    }
  }
}

export { ApiError };
