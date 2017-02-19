import * as React from 'react';

import { Socket } from './Socket';

var UsersList = React.createClass({
  render() {
      return (
          <div className='users'>
            
            
              <h3> Online Users </h3>
              <ul>
                  {
                      this.props.users.map((user, i) => {
                          return (
                              <li key={i}>
                                  {user}
                              </li>
                          );
                      })
                  }
              </ul>         
              
              {/*
              <ul>
                  {
                      this.props.pictures.map((pic, i) => {
                          return (
                              <img src={pic} alt="userPic" key={i} />
                          );
                      })
                  }
              </ul>
              */}
              
              
          </div>
      );
  }
});

var Message = React.createClass({
  render() {
      return (
          <div className="message">
              <img src={this.props.src} alt="userPic" width = "100px" height = "100px" />
              <strong>{this.props.user} :</strong> 
              <span>{this.props.text}</span>
          </div>
      );
  }
});

var MessageList = React.createClass({
  render() {
      return (
          <div className='messages'>
              <h2> Conversation: </h2>
              {
                  this.props.messages.map((message, i) => {
                      return (
                          <Message
                              key={i}
                              user={message.user}
                              text={message.text}
                              src={message.src}
                          />
                      );
                  })
              }
          </div>
      );
  }
});



var MessageForm = React.createClass({

  getInitialState() {
      return {text: ''};
  },

  handleSubmit(e) {
      e.preventDefault();
      var message = {
          user : this.props.user,
          text : this.state.text,
          src: this.props.clientPic
      }
      
      console.log("FROM MESSAGE FORM"+this.state.clientPic);
      this.props.onMessageSubmit(message); 
      this.setState({ text: '' });
  },

  changeHandler(e) {
      this.setState({ text : e.target.value });
  },

  render() {
      return(
          <div className='message_form'>
              <h3>Write New Message</h3>
              <form onSubmit={this.handleSubmit}>
                  <input
                      onChange={this.changeHandler}
                      value={this.state.text}
                  />
              </form>
          </div>
      );
  }
});

var ChangeNameForm = React.createClass({
  getInitialState() {
      return {newName: ''};
  },

  onKey(e) {
      this.setState({ newName : e.target.value });
  },

  handleSubmit(e) {
      e.preventDefault();
      var newName = this.state.newName;
      this.props.onChangeName(newName);    
      this.setState({ newName: '' });
  },

  render() {
      return(
          <div className='change_name_form'>
              <h3> Change Name </h3>
              <form onSubmit={this.handleSubmit}>
                  <input
                      onChange={this.onKey}
                      value={this.state.newName}
                  />
              </form>  
          </div>
      );
  }
});

var ChatApp = React.createClass({

  getInitialState() {
      return {users: [], 
      messages:[], 
      text: '', 
      pictures:[],
      botPic : '/static/chappie2.jpeg',
      clientPic: ''
      };
  },

  componentDidMount() {
      Socket.on('init', this._initialize);
      //Socket.on('send:message', this._messageRecieve);
      Socket.on('user:join', this._userJoined);
      Socket.on('user:left', this._userLeft);
      
      //from server
      Socket.on('send:message:client', this._messageRecieve);
      
      //Socket.on('change:name', this._userChangedName);
  },

  _initialize(data) {
      var {users, name, src} = data;
      
      console.log("init   "+src);
      this.setState({users, user: name, clientPic: src});
      console.log("current status pic"+this.state.clientPic);
  },

  _messageRecieve(message) {
      var {messages} = this.state;
      messages.push(message);
      
      console.log("the message received "+message.user + message.text);
      
      //check if the message was sent by RONBOT
      if(message.user.includes("RONBOT")){
        console.log("ITS RONBOT!!");
        message.src = this.state.botPic;
      }
      
      this.setState({messages});
  },

  _userJoined(data) {
      console.log("someone joined with rawr");
      var {users, messages, pictures, botPic} = this.state;
      
      //will grab the key from the data as the data itself :D
      var {name, src} = data;
      console.log("joined "+name);
      
      console.log(name);
      users.push(name);
      
      pictures.push(src);
      
      
      messages.push({
          user: 'RONBOT',
          text : name +' Joined',
          src: botPic
      });
      
      this.setState({users, messages, pictures});
  },

  _userLeft(data) {
      var {users, messages, botPic} = this.state;
      var {name} = data;
      console.log("a user left");
      
      var index = users.indexOf(name);
      
      users.splice(index, 1);
      messages.push({
          user: 'RONBOT',
          text : name +' Left',
          src : botPic
      });
      this.setState({users, messages});
  },

  _userChangedName(data) {
      var {oldName, newName} = data;
      var {users, messages} = this.state;
      var index = users.indexOf(oldName);
      users.splice(index, 1, newName);
      messages.push({
          user: 'RONBOT',
          text : 'Change Name : ' + oldName + ' ==> '+ newName
      });
      this.setState({users, messages});
  },

  handleMessageSubmit(message) {
      var {messages} = this.state;
      
      //var res = message.text.substring(0, 3);
      //determine if the message is for the chatbot or everyone else
      if( message.text.includes("!!")){
        console.log("chatbot about initiated");
        
        
        Socket.emit('send:message:self', message);
        
        Socket.emit('chatbot:message', message.text);
      }
      
      else{
        
        
        messages.push(message);
        this.setState({messages});
        //Socket.emit('send:message', message);
        
        //emits the message to the socket
        console.log('New message: ', message);
        
        Socket.emit('send:message:server', message);
      }
  },

  handleChangeName(newName) {
      var oldName = this.state.user;
      Socket.emit('change:name', { name : newName}, (result) => {
          if(!result) {
              return alert('There was an error changing your name');
          }
          var {users} = this.state;
          var index = users.indexOf(oldName);
          users.splice(index, 1, newName);
          this.setState({users, user: newName});
      });
  },

  render() {
      return (
          <div>
              <UsersList
                  users={this.state.users}
                  pictures={this.state.pictures}
              />
              <MessageList
                  messages={this.state.messages}
              />
              <MessageForm
                  onMessageSubmit={this.handleMessageSubmit}
                  user={this.state.user}
                  clientPic = {this.state.clientPic}
              />
              
              {/*
              <ChangeNameForm
                  onChangeName={this.handleChangeName}
              />
              */}
          </div>
      );
  }
});

export class FullChatApp extends React.Component {
    render() {
        return (
          
        <div className="Chat">
        <ChatApp/>
        {/*  <GiveMeACat /> */}
        </div>
        );
    }
} 