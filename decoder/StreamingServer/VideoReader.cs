using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

using AForge.Video;
using AForge.Video.FFMPEG;

namespace StreamingServer
{
    class VideoReader
    {
        private String filePath;
        private VideoProperties properties;
        private VideoFileReader reader;

        public VideoReader(String filePath)
        {
            try
            {
                reader = new VideoFileReader();
                reader.Open(filePath);
            }
            catch (Exception e)
            {
                throw e;
            }

            properties = new VideoProperties();
            properties.Width = reader.Width;
            properties.Height = reader.Height;
            properties.FrameCount = reader.FrameCount;
            properties.FrameRate = reader.FrameRate;
        }

        public void SkipFrame(int offset)
        {
            if (offset > 0)
            {
                for (int i = 0; i < offset; i++)
                {
                    // Skip frames
                    Bitmap videoFrame = reader.ReadVideoFrame();
                    videoFrame.Dispose();
                }
            }
        }

        public byte[] NextFrame()
        {
            Bitmap videoFrame = reader.ReadVideoFrame();
            if (videoFrame == null)
            {
                return null;
            }

            EncoderParameters encoderParameters = new EncoderParameters(1);
            EncoderParameter param = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 30L);
            encoderParameters.Param[0] = param;
            
            // For testing only:
            //videoFrame.Save("cap/" + i + ".jpg", GetEncoderInfo("image/jpeg"), encoderParameters);

            MemoryStream memoryStream = new MemoryStream();
            videoFrame.Save(memoryStream, GetEncoderInfo("image/jpeg"), encoderParameters);

            byte[] byteArray = memoryStream.ToArray();
            //Console.WriteLine("Frame " + i + ": " + byteArray.Length);

            videoFrame.Dispose();

            return byteArray;
        }

        // From: https://msdn.microsoft.com/zh-tw/library/ytz20d80(v=vs.110).aspx
        private static ImageCodecInfo GetEncoderInfo(String mimeType)
        {
            int j;
            ImageCodecInfo[] encoders;
            encoders = ImageCodecInfo.GetImageEncoders();
            for (j = 0; j < encoders.Length; ++j)
            {
                if (encoders[j].MimeType == mimeType)
                    return encoders[j];
            }
            return null;
        }

        public VideoProperties FileProperties()
        {
            return properties;
        }

        public void Close()
        {
            reader.Close();
        }

        public class VideoProperties
        {
            public int Width;
            public int Height;
            public int FrameRate;
            public long FrameCount;

            public override string ToString()
            {
                return "Width = " + Width + "\n" +
                    "Height = " + Height + "\n" +
                    "FrameRate = " + FrameRate + "\n" +
                    "FrameCount = " + FrameCount;
            }
        }
    }
}
