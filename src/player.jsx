
import React from 'react'
import ReactDOM from 'react-dom'
import dgram from 'dgram'
import cfg from '../config.js'

export class Player extends React.Component {
    constructor() {
        super()
        this.actx = new AudioContext()
        this.state = {buffering:true}
        let usrv = dgram.createSocket('udp4')
        usrv.on('message', this.recvFrame.bind(this))
        usrv.on('error', e => console.log(e))
        usrv.bind(cfg.vstream)
        this.getAudio = this.getAudio.bind(this)
        this.getVideo = this.getVideo.bind(this)
        this.initSrc = this.initSrc.bind(this)
        this.startPlayback = this.startPlayback.bind(this)
    }
    recvFrame(msg, rinfo) {
        if(msg.length) {
            let ab = new Uint8Array(msg.length)
            for(let i=0; i<msg.length; i++) ab[i] = msg[i];
            let blob = new Blob([ab], {type:'image/jpeg'})
            this.frameBuf.push(URL.createObjectURL(blob))
        } else {
            if(!this.frameBuf.length) this.frameBuf.push('');
            else this.frameBuf.push(this.frameBuf[this.frameBuf.length - 1]);
        }
        if(this.state.buffering
        && this.frameBuf.length > 300) {
            this.setState({buffering:false})
        }
    }
    getAudio(node) {
        return new Promise((rsov,rjct) => {
            let xhr = new XMLHttpRequest()
            xhr.responseType = "arraybuffer"
            xhr.addEventListener("load", _ => {
                this.actx.decodeAudioData(xhr.response)
                .then(buf => {this.audioBuf.buffer = buf; rsov()})
            })
            xhr.open("GET", `http://${node.addr}:${node.decoder}/audio`)
            xhr.setRequestHeader('x-video', this.props.src.video)
            xhr.send()
        })
    }
    getVideo(node, skip=0, frames=0) {
        return new Promise((rsov,rjct) => {
            let xhr = new XMLHttpRequest()
            xhr.addEventListener("load", rsov)
            xhr.open("GET", `http://${node.addr}:${node.decoder}/video`)
            xhr.setRequestHeader('x-video', this.props.src.video)
            xhr.setRequestHeader('x-skip-frame', skip.toString())
            xhr.setRequestHeader('x-frames', frames.toString())
            xhr.send()
        })
    }
    render() {
        if(!this.props.src) {
            this.frameBuf = []
            if(this.audioBuf) {
                try {this.audioBuf.stop()} catch(e) {}
                this.audioBuf.disconnect()
            }
            this.audioBuf = this.actx.createBufferSource()
            this.audioBuf.connect(this.actx.destination)
            this.audioBuf.onended = this.props.end
            this.state = {buffering:true}
            return <p></p>
        }
        if(this.state.buffering) {
            return <p style={{color:'#FFF'}}>buffering...</p>
        }
        return <img src="" style={{width:'100%'}}/>
    }
    async killDecoder(node) {
        return new Promise((rsov,rjct) => {
            let xhr = new XMLHttpRequest()
            xhr.addEventListener("load", _ => rsov())
            xhr.open("GET", `http://${node.addr}:${node.kill}/`)
            xhr.send()
        })
    }
    async initSrc() {
        if(this.props.src.nodes.indexOf(cfg.node) >= 0) {
            let node = {
                addr: 'localhost',
                decoder: cfg.decoder,
                vstream: cfg.vstream,
                kill: cfg.kill,
            } 
            //await this.killDecoder(node)
            //await new Promise((r) => setTimeout(r, 1500))
            this.frameBuf = []
            await this.getAudio(node)
            console.log('audio done.')
            await this.getVideo(node)
            console.log(`video done, got ${this.frameBuf.length} frames.`)
        } else {
            let nodes = this.props.src.nodes.map((id) => this.props.searcher.peers[id])
            //for(let i = 0; i < nodes.length; i++) {
            //    await this.killDecoder(nodes[i])
            //}
            //await new Promise((r) => setTimeout(r, 1500))
            this.frameBuf = []
            await this.getAudio(nodes[0])
            console.log('audio done.')
            let pts = nodes.length*2
            let ptLen = Math.floor(this.props.src.frames/pts)
            for(let pt = 0; pt < pts; pt++) {
                await this.getVideo(nodes[pt%nodes.length], pt*ptLen, ptLen)
                console.log(`video done, got ${this.frameBuf.length} frames.`)
            }
        }
    }
    startPlayback() {
        console.log('buffering done.')
        let img = ReactDOM.findDOMNode(this)
        let self = this; let t0 = null
        function rf(ts) {
            if(!self.props.src) return;
            if(!t0) {t0 = ts; self.audioBuf.start()}
            let f = Math.round((ts-t0) / (1000/self.props.src.fps))
            if(f < self.frameBuf.length) {
                img.src = self.frameBuf[f]
                requestAnimationFrame(rf)
            }
        }
        requestAnimationFrame(rf)
    }
    componentDidUpdate(prvProps, prvState) {
        if(this.props.src) {
            if(prvProps.src !== this.props.src) {
                this.initSrc()
            } else if(prvState.buffering !== this.state.buffering && !this.state.buffering) {
                this.startPlayback()
            }
        }
    }

}



