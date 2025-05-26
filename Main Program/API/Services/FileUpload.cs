using System;
using System.Runtime.CompilerServices;

namespace API.Services;

public class FileUpload
{
    public static async Task<string> Upload(IFormFile file){
        var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

        if(!Directory.Exists(uploadFolder)){
            Directory.CreateDirectory(uploadFolder);
        }

        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);

        var filePath = Path.Combine(uploadFolder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);

        await file.CopyToAsync(stream);
        return fileName;
    }
}
