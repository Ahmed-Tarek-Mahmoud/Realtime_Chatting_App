using System;
using System.Reflection.Metadata.Ecma335;

namespace API.Common;

public class Response<T>
{
    public bool IsSuccess { get; set; } = true;
    public T Data {get;}

    public string? Message { get; set; }

    public string? Error { get; set; }

   public Response(bool isSuccess,T data, string? message, string? error)
    {
        IsSuccess = isSuccess;
        Data = data;
        Message = message;
        Error = error;
    }
        
    public static Response<T> Success(T data, string? message = "") => new Response<T>(true, data, message, null);

    public static Response<T> Failure(string? error) => new Response<T>(false, default!, null, error);
}
