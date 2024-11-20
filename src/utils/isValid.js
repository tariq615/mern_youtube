import { ApiError } from "./ApiError.js";
import { isValidObjectId } from "mongoose";

const isValid = (id) => {
  if (!id) {
    throw new ApiError(400, "id is required");
  }

  if (!isValidObjectId(id)) {
    throw new ApiError(404, "invalid id");
  }
  
  return true
};

export {isValid}