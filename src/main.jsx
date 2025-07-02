import React from 'react';
import ReactDOM from 'react-dom/client';
import sleep from './sleep.js';
import Board from './board.jsx';
import './style.css';

function reducer(state2, action) {

  let state = JSON.parse(JSON.stringify(state2)) 
  
  const highlight = (row,col) => {
    state.board[row][col].highlighted=true;
    state.highlighted.push([row,col]);
  }
  
  const unhighlightAll = () => {
    state.highlighted.forEach( xy => {
      let [row,col] = xy;
      state.board[row][col].highlighted=false;
    })
  }

  const anyWhiteMoves = () => {
    for (let row=1; row<5; ++row) {
      for (let col=0; col<4; ++col) {
	if (state.board[row][col].occupant==='white') {
	  if (state.board[row-1][col].occupant === null)
	    return true;
	  if ((col>0) && (state.board[row-1][col-1].occupant === 'black'))
	    return true;
	  if ((col<3) && (state.board[row-1][col+1].occupant === 'black'))
	    return true
	}
      }
    }
    return false;
  }
  
  let {row,col} = action;

  switch (action.type) {

  case 'init':
    return newGame();

  case 'select':
    unhighlightAll();
    state.selected=[row,col];
    highlight(row,col);
    if (row>0) {
      if (state.board[row-1][col].occupant === null) {
	highlight(row-1,col);
	if ((row===4) && (state.board[row-2][col].occupant === null))
	  highlight(row-2,col);
      }
      
      if ((col>0) && (state.board[row-1][col-1].occupant === 'black'))
	highlight(row-1,col-1);
      
      if ((col<3) && (state.board[row-1][col+1].occupant === 'black'))
	highlight(row-1,col+1);

      if (row===2) {
	// check en passant moves
	if ((col>0) && ((state.board[2][col-1].occupant === 'black') &&
		      (state.board[1][col-1].passantable === true))) 
	highlight(1,col-1);
      
	if ((col<3) && ((state.board[2][col+1].occupant === 'black') &&
			(state.board[1][col+1].passantable === true))) 
	  highlight(1,col+1);
      }
      
    }
    break;

    
  case 'move':
    // clear out prior passantables
    state.board[3].forEach( (square,indx) => square.passantable=false );

    state.board[row][col].occupant='white';
    if (row===0) state.winner='White';
    
    // if we did 'en passant', remove the piece in the next row
    if (state.board[row][col].passantable && (state.board[row+1][col].occupant==='black'))
      state.board[row+1][col].occupant=null;
      
    // if we moved 2 rows, make prior square passantable
    if ((state.selected[0] - row) > 1)
      state.board[3][col].passantable = true;
    
    [row,col] = state.selected;
    state.board[row][col].occupant=null;
    unhighlightAll();
    state.selected=null;
    state.whiteTurn=false;
    break;

  case 'blackMove':
    // if white has won, then break
    if (state.winner) break;
    
    // clear out prior passantables
    state.board[1].forEach((square,indx)=>square.passantable=false);

    //get list of black moves and pick one at random
    let blackMoves=[];
    let blackAttacks=[];
    let blackWins=[];
    for (let row=0; row<4; ++row) {
      for (let col=0; col<4; ++col) {
	if (state.board[row][col].occupant==='black') {

	  if (state.board[row+1][col].occupant === null) {
	    if ( (row+1)===4 ) {
	      blackWins.push([[row,col], [row+1,col]]);
	    } else {
	      blackMoves.push([[row,col], [row+1,col]]);
	    }
	    if ((row===0) && (state.board[row+2][col].occupant === null))
	      blackMoves.push([[row,col], [row+2,col]]);
	  }
	  
	  if ((col>0) && (state.board[row+1][col-1].occupant === 'white'))
	    blackAttacks.push([[row,col], [row+1,col-1]]);

	  if ((col<3) && (state.board[row+1][col+1].occupant === 'white'))
	    blackAttacks.push([[row,col], [row+1,col+1]]);

	  if (row===2) {
	    // check out 'en passant' moves
	    // is neighbor white? is next row passantable?
	    if (col > 0) {
	      if ( (state.board[2][col-1].occupant==='white') &&
		   state.board[3][col-1].passantable) {
		blackAttacks.push([[2,col], [3,col-1]]);
	      }
	    }
	  
	    if (col < 3) {
	      if ( (state.board[2][col+1].occupant==='white') &&
		   state.board[3][col+1].passantable) {
		blackAttacks.push([[2,col], [3,col+1]])
	      }
	    }
	  }
	}
      }
    }

    
    if ( (blackMoves.length + blackAttacks.length + blackWins.length)===0) {
      state.winner='White';

    } else {
      
      if (blackWins.length>0) {
	blackMoves=blackWins;
      } else if (blackAttacks.length>0) {
	blackMoves=blackAttacks;
      }
      
      let [moveFrom,moveTo] = blackMoves[ ~~(Math.random() * blackMoves.length) ];
      state.board[moveFrom[0]][moveFrom[1]].occupant=null;
      state.board[moveTo[0]][moveTo[1]].occupant='black';
      // move 2 rows? make prior square passantable
      if ((moveTo[0]-moveFrom[0]) > 1) 
	state.board[1][moveTo[1]].passantable=true;

      // if we did 'en passant', remove the piece in the next row
      if (state.board[moveTo[0]][moveTo[1]].passantable && (state.board[moveTo[0]-1][moveTo[1]].occupant==='white'))
	state.board[moveTo[0]-1][moveTo[1]].occupant=null;

      if (moveTo[0]===4) {
	state.winner='Black';

      } else {
	// if no more whitemoves, then game over
	if (anyWhiteMoves()) {
	  state.whiteTurn=true;
	} else {
	  state.winner='Black';
	}
      }
    }
    break;
    
  } // switch

  return {...state}; 
}

const newGame = () => {
  return {
    board: [
      [ {occupant:'black', highlighted:false},
	{occupant:'black', highlighted:false},
	{occupant:'black', highlighted:false},
	{occupant:'black', highlighted:false} ],

      [ {occupant:null, highlighted:false, passantable:false},
	{occupant:null, highlighted:false, passantable:false},
	{occupant:null, highlighted:false, passantable:false},
	{occupant:null, highlighted:false, passantable:false} ],

      [ {occupant:null, highlighted:false},
	{occupant:null, highlighted:false},
	{occupant:null, highlighted:false},
	{occupant:null, highlighted:false} ],

      [ {occupant:null, highlighted:false, passantable:false},
	{occupant:null, highlighted:false, passantable:false},
	{occupant:null, highlighted:false, passantable:false},
	{occupant:null, highlighted:false, passantable:false} ],

      [ {occupant:'white', highlighted:false},
	{occupant:'white', highlighted:false},
	{occupant:'white', highlighted:false},
	{occupant:'white', highlighted:false} ]
    ],

    selected:    null,
    highlighted: [],
    whiteTurn:   true,
    winner:      null
  }
}

function App () {

  // declare these here so we can toggle between help and game
  const [state, dispatch] = React.useReducer(reducer, newGame());

  // return either game or instructions
  const [showHelp, toggleHelp] = React.useState(false);

  const Instructions = () => {
    return (
	<div id='instructionsDIV'>
	<div className='toggleHelp' onClick={()=>toggleHelp(false)}>X</div>
<p>The object of this game is to move one of your pawns to the other side of the board or capture or trap all of the opponent's pawns.</p>

<p>Move your pawns using the same rules as regular chess.</p>

<p>A pawn can move forward one row at a time unless another pawn is blocking it.</p>

<p>For its first move, a pawn can move forward one or two rows.</p>

<p>Your pawns can capture enemy pawns that are one row ahead and one column adjacent (diagonal) to yours.</p>

<p>You can also capture enemy pawns en passant.</p>

<p>If an enemy pawn moves two rows and lands next to one of yours, you can capture it as though it had only moved one row.</p>

	</div>
    )
  }

  const Winner = () => {
    return (
	<div id='winnerDiv'>
	<p>{state.winner} wins.</p>
	<button id="playAgain" onClick={()=>{ setShowWinner(false); dispatch({type:'init' }) }}>Play Again?</button>
	</div>
    )
  }
  
  const [showWinner, setShowWinner] = React.useState(false);

  const setShowWinnerDelay = async () => {
      await sleep(1000); 
      setShowWinner(true);
  }

  React.useEffect( () => {
    if (state.winner != null) setShowWinnerDelay();
  }, [state.winner] );

  
  if (showHelp) {

    return <Instructions />
    
  } else {

    return (
      <React.Fragment>

	<Board state={state} dispatch={dispatch} />

	<p className='toggleHelp' onClick={()=>toggleHelp(true)}>?</p>

        {showWinner ? <Winner /> : ''}

      </React.Fragment>
    )
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode> <App/> </React.StrictMode>);
