### CSCI3280 Karaoke System

Files:

```
/
|\_ doc/ (project spec and project report)
|\_ src/ (front-end source code)
|\_ decoder/ (video decoder backend)
|\_ music/ (.avi .ppm files)
|   \_ database.js (database file)
|\_ nwjs-sdk-v0.13.4-win-x64 (executable and build outputs)
|   \_ nw.exe (main executable)
 \_ config.js (runtime config file)
```

Build Dependencies:

* Node.JS (5.x)

Install & Run:

1. `git clone ...`
2. edit `config.js` to assign unique node ID.

Add Media:

1. put artwork and video in the `music` dir.
2. edit `music/database.js` and add more entries to the array.
