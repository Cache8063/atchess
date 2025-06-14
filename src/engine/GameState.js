export class GameState {
  constructor() {
    this.id = null
    this.white = null
    this.black = null
    this.timeControl = null
    this.whiteTime = null
    this.blackTime = null
    this.rated = true
    this.status = 'waiting' // waiting, playing, paused, finished
    this.result = null // 1-0, 0-1, 1/2-1/2
    this.startTime = null
    this.endTime = null
    this.lastMoveTime = null
    this.increment = 0
  }

  initialize(config) {
    this.id = config.id || this.generateId()
    this.white = config.white
    this.black = config.black
    this.timeControl = config.timeControl
    this.whiteTime = config.time || config.timeControl?.time
    this.blackTime = config.time || config.timeControl?.time
    this.increment = config.increment || config.timeControl?.increment || 0
    this.rated = config.rated ?? true
    this.status = 'waiting'
  }

  start() {
    this.status = 'playing'
    this.startTime = Date.now()
    this.lastMoveTime = Date.now()
  }

  pause() {
    if (this.status === 'playing') {
      this.status = 'paused'
    }
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'playing'
      this.lastMoveTime = Date.now()
    }
  }

  updateTime(color) {
    if (this.status !== 'playing') return
    
    const now = Date.now()
    const elapsed = (now - this.lastMoveTime) / 1000
    
    if (color === 'white') {
      this.whiteTime = Math.max(0, this.whiteTime - elapsed + this.increment)
    } else {
      this.blackTime = Math.max(0, this.blackTime - elapsed + this.increment)
    }
    
    this.lastMoveTime = now
    
    if (this.whiteTime === 0 || this.blackTime === 0) {
      this.timeout(this.whiteTime === 0 ? 'white' : 'black')
    }
  }

  timeout(color) {
    this.status = 'finished'
    this.endTime = Date.now()
    this.result = color === 'white' ? '0-1' : '1-0'
  }

  finish(result) {
    this.status = 'finished'
    this.endTime = Date.now()
    this.result = result
  }

  getElapsedTime() {
    if (!this.startTime) return 0
    const end = this.endTime || Date.now()
    return Math.floor((end - this.startTime) / 1000)
  }

  getCurrentPlayerTime(color) {
    if (this.status !== 'playing' || !this.lastMoveTime) {
      return color === 'white' ? this.whiteTime : this.blackTime
    }
    
    const elapsed = (Date.now() - this.lastMoveTime) / 1000
    const time = color === 'white' ? this.whiteTime : this.blackTime
    return Math.max(0, time - elapsed)
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  serialize() {
    return {
      id: this.id,
      white: this.white,
      black: this.black,
      timeControl: this.timeControl,
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
      increment: this.increment,
      rated: this.rated,
      status: this.status,
      result: this.result,
      startTime: this.startTime,
      endTime: this.endTime,
      lastMoveTime: this.lastMoveTime
    }
  }

  static deserialize(data) {
    const state = new GameState()
    Object.assign(state, data)
    return state
  }
}