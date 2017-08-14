using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Net;
using System.Net.Sockets;

namespace StreamingServer
{
    class VideoUdpSender
    {
        private IPAddress ipAddress;
        private Int32 serverPort;
        private Thread serverThread;
        private UdpClient udpClient;
        private VideoReader videoReader;
        private int framesToRead = 0;
        private bool isEnded = false;

        public VideoUdpSender(VideoReader reader, int framesToRead, IPAddress ipAddress, Int32 port)
        {
            serverPort = port;
            videoReader = reader;

            this.framesToRead = framesToRead;

            IPEndPoint ipEndPoint = new IPEndPoint(ipAddress, 10005);
            udpClient = new UdpClient();
            udpClient.Client.SendTimeout = 2000;

            serverThread = new Thread(() =>
            {
                int count = 0;
                while (true)
                {
                    byte[] sendBytes = reader.NextFrame();

                    // End of the video
                    if (sendBytes == null)
                    {
                        break;
                    }

                    // Send the frame to the client-side
                    try{
                        if(sendBytes.Length > 65535) {
                            Console.WriteLine("Frame = {0}, {1} bytes, dropped", count, sendBytes.Length);
                            udpClient.Send(sendBytes, 0, ipEndPoint);
                        } else {
                            udpClient.Send(sendBytes, sendBytes.Length, ipEndPoint);
                        }
                    } catch (Exception e) {
                        //Console.WriteLine(e.ToString());
                    }
                    count++;

                    // All requested frames are sent
                    if (count >= framesToRead && framesToRead > 0)
                    {
                        break;
                    }
                }

                /*byte[] endMessage = Encoding.ASCII.GetBytes("END");
                  udpClient.Send(endMessage, endMessage.Length, ipEndPoint);*/
                isEnded = true;
            });
            serverThread.Start();
        }

        public bool isAllSent()
        {
            return isEnded;
        }
    }
}
