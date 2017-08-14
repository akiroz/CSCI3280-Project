
import {spawn} from 'child_process'
import dgram from 'dgram'
import http from 'http'
import stream from 'stream'
import CRC32 from 'crc-32'
import PPM from 'ppm'
import cfg from '../config.js'
import database from '../music/database.js'

export class Searcher {
    constructor(decoder) {
        this.peers = {}
        this.local = database
        this.decoder = decoder
        this.ctx = document.getElementById('mycanvas').getContext('2d')
        this._keywords = this.local
            .map(s => [s.title, s.artist])
            .reduce((p,v) => p.concat(v), [])
        this.setup()
    }
    async setup() {
        let usrv = this.usrv = dgram.createSocket('udp4')
        usrv.on('message', this.addPeer.bind(this))
        usrv.on('error', e => console.log(e))
        usrv.bind(cfg.search)
        await new Promise(r => usrv.on('listening', r))
        let hsrv = http.createServer(this.handleSearch.bind(this))
        hsrv.on('error', e => console.log(e))
        hsrv.listen(cfg.search)
        await new Promise(r => hsrv.on('listening', r))
        let ksrv = http.createServer(this.killDecoder.bind(this))
        ksrv.on('error', e => console.log(e))
        ksrv.listen(cfg.kill)
        await new Promise(r => ksrv.on('listening', r))
        usrv.setBroadcast(true)
        usrv.send(JSON.stringify({
            node: cfg.node,
            decoder: cfg.decoder,
            vstream: cfg.vstream,
            kill: cfg.kill,
            keywords: this.keywords,
            broadcast: true,
        }), cfg.search, cfg.broadcast)
    }
    async killDecoder(req,res) {
        this.decoder.kill('SIGKILL')
        await new Promise((r) => this.decoder.on('exit', _ => {console.log('decoder killed'); r()}))
        this.decoder = spawn('StreamingServer.exe', [], {cwd: '..\\decoder\\StreamingServer\\bin\\Debug'})
        this.decoder.on('error', e => console.log(e))
        this.decoder.stdout.setEncoding('utf8')
        this.decoder.stdout.on('data', dat => console.log(dat))
        console.log('decoder started.')
        res.end()
    }
    addPeer(msg, rinfo) {
        let peer = JSON.parse(msg.toString())
        console.log(peer)
        if(peer.node !== cfg.node) {
            this.peers[peer.node] = {
                addr: rinfo.address,
                port: rinfo.port,
                decoder: peer.decoder,
                vstream: peer.vstream,
                kill: peer.kill,
                keywords: peer.keywords
            }
            if(peer.broadcast) {
                this.usrv.send(JSON.stringify({
                    node: cfg.node,
                    decoder: cfg.decoder,
                    vstream: cfg.vstream,
                    kill: cfg.kill,
                    keywords: this.keywords,
                    broadcast: false,
                }), rinfo.port, rinfo.address)
            }
        }
    }
    get keywords() {
        return Object.keys(this.peers)
        .map(k => this.peers[k].keywords)
        .reduce((p,v) => p.concat(v), this._keywords)
    }
    handleSearch(req,res) {
        let q = req.headers['x-query']
        let songs = this.local.filter(s => (s.title + s.artist).indexOf(q) > -1)
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify(songs))
    }
    async search(q) {
        function queryPeer(id) {
            return new Promise((rsov,rjct) => {
                let node = this.peers[id]
                let xhr = new XMLHttpRequest()
                xhr.responseType = "json"
                xhr.addEventListener("load", _ => rsov(xhr.response))
                xhr.open("GET", `http://${node.addr}:${node.port}/`)
                xhr.setRequestHeader('x-query', q)
                xhr.send()
            })
        }
        let songs = {}
        this.local
        .filter(s => (s.title + s.artist).indexOf(q) > -1)
        .forEach(s => songs[CRC32.str(s.title+s.artist)] = s)
        let remote = await Promise.all(Object.keys(this.peers).map(queryPeer.bind(this)))
        remote.reduce((p,v) => p.concat(v), []).forEach(s => {
            let key = CRC32.str(s.title+s.artist)
            if(songs.hasOwnProperty(key)) {
                if(songs[key].hasOwnProperty('video'))
                    songs[key].nodes.push(s.nodes[0]);
                else songs[key].artwork.push(s.artwork[0])
            }
            else songs[key] = s;
        })
        // generate interleaved ppm
        async function toImageData(ppm) {
            let s = stream.Readable()
            s._read = ()=>{}
            s.push(ppm); s.push(null)
            let raw = await new Promise((r) => PPM.parse(s, (e,d) => r(d)))
            let img = this.ctx.createImageData(raw[0].length, raw.length)
            for(let r=0; r<img.height; r++) {
                for(let c=0; c<img.width; c++) {
                    img.data[4*(r*img.width+c)+0] = raw[r][c][0]
                    img.data[4*(r*img.width+c)+1] = raw[r][c][1]
                    img.data[4*(r*img.width+c)+2] = raw[r][c][2]
                    img.data[4*(r*img.width+c)+3] = 255
                }
            }
            return img
        }
        for(let k in songs) {
            let s = songs[k]
            if(!s.hasOwnProperty('video')) {
                let ids = await Promise.all(s.artwork.map(toImageData.bind(this)))
                let img = this.ctx.createImageData(ids[0])
                for(let px=0; px < (img.data.length/4); px++) {
                    img.data[px*4+0] = ids[px%ids.length].data[px*4+0]
                    img.data[px*4+1] = ids[px%ids.length].data[px*4+1]
                    img.data[px*4+2] = ids[px%ids.length].data[px*4+2]
                    img.data[px*4+3] = ids[px%ids.length].data[px*4+3]
                }
                this.ctx.canvas.height = img.height
                this.ctx.canvas.width = img.width
                this.ctx.putImageData(img,0,0)
                s.image = this.ctx.canvas.toDataURL()
            }
        }
        return songs
    }
}




