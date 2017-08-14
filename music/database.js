
var data = [
    // music videos:
    {
        artwork: require('./7thSense.png'),
        video: '7thSense.avi',
        title: '7thSense',
        artist: 'Sakuzyo',
        frames: 4080,
        fps: 30,
    },
    {
        artwork: require('./ArrivalOfTears.jpg'),
        video: 'ArrivalOfTears.avi',
        title: 'Arrival of Tears',
        artist: '彩音',
        frames: 2623,
        fps: 29.97,
    },
    {
        artwork: require('./OshamaScramble.jpg'),
        video: 'OshamaScramble.avi',
        title: 'Oshama Scramble',
        artist: 't+pazolite',
        frames: 3850,
        fps: 30,
    },
    {
        artwork: require('./ThisGame.jpg'),
        video: 'ThisGame.avi',
        title: 'This Game',
        artist: 'Suzuki Konomi',
        frames: 2668,
        fps: 29.97,
    },
    // ppm images:
    {
        artwork: [require('./aqua.ppm')],
        title: 'aqua',
        artist: 'SORAHANE',
    },
]

var Path = require('path')
var cfg = require('../config.js')

module.exports = cfg.entries.map((index) => {
    let song = data[index]
    if(song.hasOwnProperty('video')) {
        song.video = Path.join(process.cwd(), '..', 'music', song.video)
    }
    song.nodes = [cfg.node]
    return song
})

console.log(module.exports)
