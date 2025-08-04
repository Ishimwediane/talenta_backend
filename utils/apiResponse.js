export class ApiResponse {
  static success(res, message = 'Success', data = null, statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message = 'Error', errors = null, statusCode = 500) {
    return res.status(statusCode).json({
      status: 'error',
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static paginated(res, message = 'Success', data = null, pagination = null, statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }
} 