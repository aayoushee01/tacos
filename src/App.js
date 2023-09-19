import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import './App.css'; 
import Board from './components/Board'; // Assume you have a Board component

const Container = styled.div`
  margin: 2em;
  display: flex;
  @media (max-width: 720px) {
    flex-direction: column;
  }
  align-items: center;
  justify-items: center;
`;

const NewBoardButton = styled.button`
  font-size: 1em;
  color: grey;
  min-width: 100px;
  text-align: center;
  cursor: pointer;
`;

const BoardContainer = styled.div`
  margin: 1em 0;
  padding: 1em;
`;

const BoardHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const App = () => {
  const [boards, setBoards] = useState(() => {
    const savedBoards = localStorage.getItem('trello-boards');
    const initialValue = JSON.parse(savedBoards);
    return initialValue || [];
  });

  const onAddNewBoard = () => {
    const newBoard = {
      id: `board-${genRandomID()}`,
      title: 'New Board',
      dataset: {},
    };
    // console.log("New Board Created");
    setBoards([...boards, newBoard]);
  };

  const onCloseBoard = (boardId) => {
    const updatedBoards = boards.filter((board) => board.id !== boardId);
    setBoards(updatedBoards);
  };

  useEffect(() => {
    localStorage.setItem('trello-boards', JSON.stringify(boards));
  }, [boards]);

  return (
    <Container>
       <div className="App">
        <div className='header'>
        <h1>Taco's Tacos</h1>
        <NewBoardButton onClick={onAddNewBoard}>+ New Board</NewBoardButton>
        </div>
        {boards.map((board) => (
          <BoardContainer key={board.id}>
            <BoardHeader>
              {/* <div>{board.title}</div> */}
              <button onClick={() => onCloseBoard(board.id)}>Close</button>
            </BoardHeader>
            <Board board={board} />
          </BoardContainer>
        ))}
      </div>
    </Container>
  );
};

function genRandomID() {
  return (Math.random() + 1).toString(36).substring(7);
}

export default App;
