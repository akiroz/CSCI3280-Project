using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;

namespace StreamingServer
{
    class Program
    {
        static void Main(string[] args)
        {
            MicroHttpServer mhs = new MicroHttpServer(10001,
            (req) =>
            {
                
                if (req.Url.StartsWith("/audio"))
                    return GetAudio(req);
                else if (req.Url.StartsWith("/video"))
                    return GetVideo(req);
                else
                    return NoFileResponse();
            });
        }

        public static CompactResponse NoFileResponse()
        {
            return new CompactResponse()
            {
                ContentType = "text/plain",
                Data = Encoding.UTF8.GetBytes("Video path not specified"),
                StatusText = CompactResponse.HttpStatus.Http404
            };
        }

        public static CompactResponse NotVideoFileResponse()
        {
            return new CompactResponse()
            {
                ContentType = "text/plain",
                Data = Encoding.UTF8.GetBytes("It is not a video file"),
                StatusText = CompactResponse.HttpStatus.Http500
            };
        }

        public static CompactResponse GetAudio(CompactRequest req)
        {

            //foreach (KeyValuePair<string, string> kvp in req.Headers) {
            //    Console.WriteLine("{0}: {1}", kvp.Key, kvp.Value);
            //}
            if (!req.Headers.ContainsKey("x-video"))
            {
                return NoFileResponse();
            }

            string videoPath = req.Headers["x-video"].Trim();
            if (!videoPath.EndsWith(".avi") && !videoPath.EndsWith(".mp4"))
            {
                return NotVideoFileResponse();
            }

            byte[] buf;
            try
            {
                AudioHandler audio = new AudioHandler(videoPath);
                string tmpFilePath = audio.StartProcess();
                buf = System.IO.File.ReadAllBytes(tmpFilePath);
            }
            catch (Exception e)
            {
                return NotVideoFileResponse();
            }

            return new CompactResponse()
            {
                ContentType = "audio/ogg",
                Data = buf
            };
        }

        public static CompactResponse GetVideo(CompactRequest req)
        {
            if (!req.Headers.ContainsKey("x-video"))
            {
                return NoFileResponse();
            }

            string videoPath = req.Headers["x-video"].Trim();
            if (!videoPath.EndsWith(".avi") && !videoPath.EndsWith(".mp4"))
            {
                return NotVideoFileResponse();
            }

            VideoReader reader;
            try
            {
                reader = new VideoReader(videoPath);
            }
            catch (Exception e)
            {
                return NoFileResponse();
            }

            int startOffset = req.Headers.ContainsKey("x-skip-frame") ? Int32.Parse(req.Headers["x-skip-frame"]) : 0;
            int readFrames = req.Headers.ContainsKey("x-frames") ? Int32.Parse(req.Headers["x-frames"]) : 0;
            reader.SkipFrame(startOffset);

            VideoUdpSender sender = new VideoUdpSender(reader, readFrames, req.ipAddress, 10005);
            //Console.WriteLine("IP Address = " + req.ipAddress.ToString());

            /*string response = reader.FileProperties().FrameRate+"\n"
                + reader.FileProperties().FrameCount + "\n"
                + reader.FileProperties().Width + "\n"
                + reader.FileProperties().Height;*/
            string response = "OK";

            // Hold the HTTP session until everything is sent
            while (!sender.isAllSent()) ;

            return new CompactResponse()
            {
                ContentType = "text/plain",
                Data = Encoding.UTF8.GetBytes(response)
            };
        }
    }

}
