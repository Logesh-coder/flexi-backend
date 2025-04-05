export const successResponse = (
    res: any,
    data: any,
    statusCode: number = 200
) => {
    return res.status(statusCode).json({
      status: 'success',
      data,
    });
};
  
export const errorResponse = (
    res: any,
    message: string = '',
    statusCode: number = 500,
    data?: any
) => {
    const response = {
        status: 'error',
        message,
        ...(data && { data }),
    };
    return res.status(statusCode).json(response);
};