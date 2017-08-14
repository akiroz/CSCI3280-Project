import {spawn} from 'child_process'
import React from 'react'
import ReactDOM from 'react-dom'
import CRC32 from 'crc-32'

require('react-tap-event-plugin')()
import 'font-awesome/css/font-awesome.css'
import AppBar from 'material-ui/lib/app-bar'
import FlatButton from 'material-ui/lib/flat-button'
import IconButton from 'material-ui/lib/icon-button'
import LeftNav from 'material-ui/lib/left-nav'
import Toolbar from 'material-ui/lib/toolbar/toolbar'
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group'
import AutoComplete from 'material-ui/lib/auto-complete'
import GridList from 'material-ui/lib/grid-list/grid-list'
import GridTile from 'material-ui/lib/grid-list/grid-tile'

import {Player} from './player.jsx'
import {Searcher} from './searcher.es6'

class App extends React.Component {
    constructor() {
        super()
        this.decoder = spawn('StreamingServer.exe', [], {cwd: '..\\decoder\\StreamingServer\\bin\\Debug'})
        this.decoder.on('error', e => console.log(e))
        this.decoder.stdout.setEncoding('utf8')
        this.decoder.stdout.on('data', dat => console.log(dat))
        console.log('decoder started.')
        process.on('exit', _ => this.decoder.kill())
        this.searcher = new Searcher(this.decoder)
        this.state = {menu:false, song:null, play:false, songs:{}, query:''}
    }
    changeQuery(query) {
        this.setState({query})
    }
    async search(query) {
        if(typeof query !== 'string') query = this.state.query
        let songs = await this.searcher.search(query)
        this.setState({songs})
    }
    play(song) {
        this.setState({song:song, menu:false, play:true})
    }
    togglePlay() {
        this.setState({play: !this.state.play})
    }
    stop() {
        this.setState({play:false, song:null})
    }
    render() {
        let menu = <FlatButton label="Menu" onClick={()=> this.setState({menu:true})} />
        let play = <p/>
        if(this.state.song) play = (
            <div>
                <IconButton
                    style={{display:'none'}}
                    onClick={this.togglePlay.bind(this)}
                    iconClassName={'fa ' + ((this.state.play)? 'fa-pause': 'fa-play')}
                    iconStyle={{color:'#FFF'}}/>
                <IconButton
                    onClick={this.stop.bind(this)}
                    iconClassName={'fa fa-stop'}
                    iconStyle={{color:'#FFF'}}/>
            </div>
        )
        let gridTiles = Object.keys(this.state.songs).map((id) => {
            let song = this.state.songs[id]
            if(song.hasOwnProperty('video')) {
                let playbtn = <IconButton 
                    onClick={()=> this.play.bind(this)(song)}
                    iconClassName="fa fa-play"
                    iconStyle={{color:'#FFF'}}/>
                return (
                    <GridTile key={id} actionIcon={playbtn}
                        title={song.title} subtitle={`by ${song.artist}`} >
                        <img src={song.artwork} />
                    </GridTile>
                )
            } else { // ppm entry
                return (
                    <GridTile key={id} title={song.title}
                        subtitle={`by ${song.artist}`} >
                        <img src={song.image} />
                    </GridTile>
                )
            }
        })
        return (
            <div>
                <AppBar title={(this.state.song)? `${this.state.song.title} - ${this.state.song.artist}`: ''}
                    iconElementLeft={play}
                    iconElementRight={menu} />
                <LeftNav width={600} openRight={true}
                    docked={false} open={this.state.menu}
                    onRequestChange={menu => this.setState({menu})}>
                    <Toolbar>
                        <ToolbarGroup float="left">
                            <AutoComplete hintText="Keyword"
                                style={{width:'400px'}}
                                disableFocusRipple={false}
                                filter={AutoComplete.fuzzyFilter}
                                dataSource={this.searcher.keywords}
                                onNewRequest={this.search.bind(this)}
                                onUpdateInput={this.changeQuery.bind(this)}/>
                        </ToolbarGroup>
                        <ToolbarGroup float="right">
                            <FlatButton label="Search"
                                onClick={this.search.bind(this)} />
                        </ToolbarGroup>
                    </Toolbar>
                    <GridList cellHeight={300} style={{width:'100%'}}>
                        {gridTiles}
                    </GridList>
                </LeftNav>
                <Player src={this.state.song} play={this.state.play}
                    searcher={this.searcher} end={this.stop.bind(this)} />
            </div>
        )
    }
}

ReactDOM.render(<App/>, document.getElementById('app'))


