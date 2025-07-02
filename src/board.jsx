import sleep from './sleep.js';

const Board = ({state, dispatch}) => {
  
  const handleClick = async (row,col) => {
    if (state.whiteTurn) {
      // if own piece, select that and highlight attackable squares
      if (state.board[row][col].occupant === 'white') {

	dispatch({type:'select', row:row, col:col });
      
      } else if ( (state.selected != null) &&
		  state.board[row][col].highlighted) {
      
	await dispatch({type:'move', row:row, col:col });

	// black's turn
	if (state.winner===null) {
	  await sleep(500);
	  await dispatch({type:'blackMove'});
	}
      }
    }
  }

  const Square = ({row,col}) => {
    let {occupant,highlighted} = state.board[row][col];
    let fill = ((row+col)%2===0) ? '#ccc' : '#888';
    if (highlighted) {
      fill = (occupant==='white') ? '#8f8' : '#cfc';
    }
    return (
      <g transform={`translate( ${col*200}, ${row*200})`}
	 onClick={()=>handleClick(row,col)} >
	<rect height='200' width='200' stroke="#000" fill={fill} />
	{(occupant !== null) ? <Piece color={occupant} /> : null}
      </g>
    )
  }

  const Piece = ({color}) => {
    return <g fill={color} stroke="#000">
      <ellipse cx="100" cy="140" rx="20" ry="40" />
      <path d="M50,190 c10,-50 90,-50 100,0 z" />
      <circle cx="100" cy="80" r="25" />
      </g>
  }

  return (
    <svg viewBox="0 0 800 1000">

      {state.board.map( (x,row) =>
		  x.map( (y,col) =>
			 <Square key={row.toString()+col.toString()}
				   row={row} col={col} />
		       ))}
    
    </svg>
  )
  
}

export default Board;
