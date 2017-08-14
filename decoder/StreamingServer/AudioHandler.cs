using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Security.Cryptography;

namespace StreamingServer
{
    class AudioHandler
    {
        private String filePath;

        public AudioHandler(String filePath)
        {
            this.filePath = filePath;
        }

        public string StartProcess()
        {
            Console.WriteLine("Preparing Conversion");

            if (!System.IO.File.Exists(filePath))
            {
                throw new Exception("Video file not found");
            }

            string tmpFileName = CalculateMD5Hash("filePath")+".ogg";
            string param = String.Format("-y -i \"{0}\" -nostdin -vn -acodec libvorbis \"{1}\"", filePath, "tmp\\"+tmpFileName);
            string result = Execute("ffmpeg.exe", param);

            //Console.WriteLine("result = " + result);
            return "tmp\\" + tmpFileName;
        }

        private static string Execute(string exePath, string parameters)
        {
            string result = String.Empty;

            using (Process p = new Process())
            {
                p.StartInfo.UseShellExecute = false;
                p.StartInfo.CreateNoWindow = true;
                p.StartInfo.RedirectStandardOutput = true;
                p.StartInfo.FileName = exePath;
                p.StartInfo.Arguments = parameters;
                p.Start();
                p.WaitForExit();

                result = p.StandardOutput.ReadToEnd();
            }

            return result;
        }

        // MD5 Function from https://blogs.msdn.microsoft.com/csharpfaq/2006/10/09/how-do-i-calculate-a-md5-hash-from-a-string/
        public static string CalculateMD5Hash(string input)
        {
            // step 1, calculate MD5 hash from input
            MD5 md5 = System.Security.Cryptography.MD5.Create();
            byte[] inputBytes = System.Text.Encoding.ASCII.GetBytes(input);
            byte[] hash = md5.ComputeHash(inputBytes);

            // step 2, convert byte array to hex string
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < hash.Length; i++)
            {
                sb.Append(hash[i].ToString("X2"));
            }

            return sb.ToString();
        }

    }
}
