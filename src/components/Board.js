import React, { useState, useEffect, Fragment } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import styled from 'styled-components';

const ITEM_TYPES = {
  CARD: "card",
  TASK: "task"
};

const DATASET = {
  tasks: {},
  cards: {
    "card-1": { id: "card-1", title: "RESOURCES", taskIds: ["task-1", "task-2", "task-3", "task-4", "task-5"] },
    "card-2": { id: "card-2", title: "TODO", taskIds: ["task-6", "task-7", "task-8", "task-9", "task-10"] },
    "card-3": { id: "card-3", title: "DOING", taskIds: ["task-11", "task-12", "task-13", "task-14", "task-15"] },
    "card-4": { id: "card-4", title: "COMPLETED", taskIds: ["task-16", "task-17", "task-18", "task-19", "task-20"] }
  },
  cardOrder: ["card-1", "card-2", "card-3", "card-4"]
};

const Container = styled.div`
  margin: 2em;
  display: flex;
  @media (max-width: 720px) {
    flex-direction: column;
  }
  align-items: center;
  justify-items: center;
`;

const NewCard = styled.div`
  font-size: 1em;
  color: black;
  min-width: 100px;
  text-align: center;
  cursor: pointer;
`;
function Board(props) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getObjectById = (id) => {
    const storedArray = localStorage.getItem('trello-boards');
    console.log("storedArray"+ storedArray);
    if (!Array.isArray(storedArray)) {
      return null;
    }
    return storedArray.find((item) => item.id === id);
  };
  const [dataset, _] = useState(() => {
    const savedDataset = DATASET;
    if(getObjectById(props.board.id) != null){
      savedDataset = getObjectById(props.board.id).getItem('dataset');
    }
    return savedDataset;
  });

  const [tasks, setTasks] = useState(dataset.tasks);
  const [cards, setCards] = useState(dataset.cards);
  const [cardOrder, setCardOrder] = useState(dataset.cardOrder);

  useEffect(() => {
    // Define the API endpoint
    const apiUrl = 'https://dummyjson.com/todos?limit=20';

    // Fetch data from the API
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setData(data);
        console.log(data);
        data.todos.forEach(todo => {
          DATASET.tasks[`task-${todo.id}`] = {
            id: `task-${todo.id}`,
            content: todo.todo
          };
        });
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
    // Retrieve existing boards from local storage
    const existingBoards = JSON.parse(localStorage.getItem('trello-boards')) || [];

    // Check if the board with this id already exists
    const existingBoardIndex = existingBoards.findIndex(board => board.id === props.board.id);

    // Create a new board object with the updated dataset
    const updatedBoard = {
      id: props.board.id,
      title: props.board.title,
      dataset: { tasks, cards, cardOrder }
    };

    if (existingBoardIndex !== -1) {
      // Update the existing board
      existingBoards[existingBoardIndex] = updatedBoard;
    } else {
      // Add the new board to the array
      existingBoards.push(updatedBoard);
    }

    // Save the updated boards array back to local storage
    localStorage.setItem('trello-boards', JSON.stringify(existingBoards));

  }, [props.board.id, tasks, cards, cardOrder]);


  const onAddNewCard = () => {
    const newCard = {
      id: "card-" + genRandomID(),
      title: "**New**",
      taskIds: []
    };
    const newCardOrder = Array.from(cardOrder);
    newCardOrder.push(newCard.id);
    setCards({
      ...cards,
      [newCard.id]: newCard
    });
    setCardOrder(newCardOrder);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Container>
      <DragDropCards
        cards={cards}
        tasks={tasks}
        cardOrder={cardOrder}
        setCards={setCards}
        setTasks={setTasks}
        setCardOrder={setCardOrder}
      />
        <NewCard onClick={onAddNewCard}>+ New Card</NewCard>
    </Container>
  );
}

const CardsContainer = styled.div`
  margin: 2em;
  display: flex;
  @media (max-width: 720px) {
    flex-direction: column;
  }
`;
function DragDropCards({
  cards,
  tasks,
  cardOrder,
  setCards,
  setTasks,
  setCardOrder
}) {
  const [editing, setEditing] = useState(null);

  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    if (type === ITEM_TYPES.CARD) {
      reorderCards(source, destination, draggableId);
    } else {
      // type === tasks
      const start = cards[source.droppableId];
      const finish = cards[destination.droppableId];
      if (start.id === finish.id) {
        reorderTasksWithinCard(
          start,
          source.index,
          destination.index,
          draggableId
        );
      } else {
        moveTask(start, finish, source.index, destination.index, draggableId);
      }
    }
  };

  const reorderCards = (source, destination, draggableId) => {
    const newCardOrder = Array.from(cardOrder);
    newCardOrder.splice(source.index, 1);
    newCardOrder.splice(destination.index, 0, draggableId);
    setCardOrder(newCardOrder);
  };

  const reorderTasksWithinCard = (
    card,
    sourceIdx,
    destinationIdx,
    draggableId
  ) => {
    const newTaskIds = Array.from(card.taskIds);
    newTaskIds.splice(sourceIdx, 1);
    newTaskIds.splice(destinationIdx, 0, draggableId);
    setCards({
      ...cards,
      [card.id]: {
        ...card,
        taskIds: newTaskIds
      }
    });
  };

  const moveTask = (start, finish, sourceIdx, destinationIdx, draggableId) => {
    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(sourceIdx, 1);
    const newStart = {
      ...start,
      taskIds: startTaskIds
    };
    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destinationIdx, 0, draggableId);
    const newFinish = {
      ...finish,
      taskIds: finishTaskIds
    };
    setCards({
      ...cards,
      [newStart.id]: newStart,
      [newFinish.id]: newFinish
    });
  };

  const onAddNewTask = (cardID, content) => {
    const newTask = {
      id: "task-" + genRandomID(),
      content
    };
    setTasks({
      ...tasks,
      [newTask.id]: newTask
    });
    const newTaskIds = Array.from(cards[cardID].taskIds);
    newTaskIds.push(newTask.id);
    setCards({ ...cards, [cardID]: { ...cards[cardID], taskIds: newTaskIds } });
  };

  const onRemoveCard = (cardID) => {
    const newCardOrder = cardOrder.filter((id) => id !== cardID);
    setCardOrder(newCardOrder);
    const cardTaskIds = cards[cardID].taskIds;
    cardTaskIds.forEach((taskID) => delete tasks[taskID]);
    delete cards[cardID];
    delete cardOrder["{cardID}"];
    setCards(cards);
    setTasks(tasks);
  };

  const onRemoveTask = (taskID, cardID) => {
    const newTaskIds = cards[cardID].taskIds.filter((id) => id !== taskID);
    setCards({ ...cards, [cardID]: { ...cards[cardID], taskIds: newTaskIds } });
    delete tasks[taskID];
    setTasks(tasks);
  };

  const onSaveTitleEdit = (cardID, newTitle) => {
    if (newTitle !== cards[cardID].title) {
      setCards({
        ...cards,
        [cardID]: {
          ...cards[cardID],
          title: newTitle
        }
      });
    }
    setEditing(null);
  };

  const onSaveTaskEdit = (taskID, cardID, newContent) => {
    if (newContent.trim() === "") {
      onRemoveTask(taskID, cardID);
    } else if (newContent !== tasks[taskID].content) {
      setTasks({
        ...tasks,
        [taskID]: { ...tasks[taskID], content: newContent }
      });
    }
    setEditing(null);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="all-cards" direction="horizontal" type="card">
        {(provided) => (
          <CardsContainer {...provided.droppableProps} ref={provided.innerRef}>
            {cardOrder.filter((id) => cards[id]).map((id, index) => {
              const card = cards[id];
              const cardTasks = card && card.taskIds ? card.taskIds.map((taskId) => tasks[taskId]) : [];
              return (
                <Card
                  key={card.id}
                  card={card}
                  tasks={cardTasks}
                  index={index}
                  // onFocusClick={() => onFocusClick(card.id)}
                  onSaveTitleEdit={(title) => onSaveTitleEdit(card.id, title)}
                  onRemoveCard={() => onRemoveCard(card.id)}
                  onAddNewTask={(content) => onAddNewTask(card.id, content)}
                  onSaveTaskEdit={(taskID, newContent) =>
                    onSaveTaskEdit(taskID, card.id, newContent)
                  }
                  onTitleDoubleClick={() => setEditing(card.id)}
                  onTaskDoubleClick={(task) => setEditing(task.id)}
                  isTitleEditing={card && editing === card.id}
                  isTaskEditing={(task) => task && editing === task.id}
                />
              );
            })}
            {provided.placeholder}
          </CardsContainer>
        )}
      </Droppable>
    </DragDropContext>
  );
}

const TitleBar = styled.div`
  display: flex;
  justify-content: space-between;
`;
const Title = styled.h3`
  padding: 8px;
  font-size: 1.5em;
  text-overflow: ellipsis;
`;
const Cross = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  text-align: right;
  color: grey;
`;
const CardContainer = styled.div`
  margin: 8px;
  border: 1px solid lightgrey;
  border-radius: 12px;
  width: 350px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  background-color: #e0e4e4;
`;
const TaskList = styled.div`
  padding: 8px;
  background-color: ${(props) =>
    props.isDraggingOver ? "skyblue" : "inherit"};
  min-height: 100px;
  height: 100%;
`;
const NewTaskBar = styled.div`
  display: flex;
`;
const NewTaskButton = styled.div`
  padding: 8px;
  margin: 8px;
  cursor: pointer;
  text-align: right;
  color: grey;
`;

function Card(props) {
  const [isAddingNewTask, setIsAddingNewTask] = useState(false);
  const onSaveTask = (content) => {
    if (content.trim() !== "") {
      props.onAddNewTask(content);
    }
    setIsAddingNewTask(false);
  };

  return (
    <Draggable draggableId={props.card.id} index={props.index}>
      {(provided) => (
        <CardContainer
          ref={provided.innerRef}
          {...provided.draggableProps}
          id={props.card.id}
        >
          <TitleBar>
            {props.isTitleEditing ? (
              <EditInput
                key={props.card.id}
                value={props.card.title}
                onSave={props.onSaveTitleEdit}
                fontSize="1.5em"
                margin="20px 0 20px 8px"
              />
            ) : (
              <Title
                onDoubleClick={props.onTitleDoubleClick}
                {...provided.dragHandleProps}
              >
                {props.card.title}
              </Title>
            )}
            <Cross onClick={props.onRemoveCard}>x</Cross>
          </TitleBar>
          {props.card && props.card.id && (
  <Droppable droppableId={props.card.id} type="task">
    {(provided, snapshot) => (
              <Fragment>
                <TaskList
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  isDraggingOver={snapshot.isDraggingOver}
                >
                  {props.tasks.map((task, index) => (
                    <Task
                      key={task.id}
                      task={task}
                      index={index}
                      onSaveTaskEdit={(content) =>
                        props.onSaveTaskEdit(task.id, content)
                      }
                      onTaskDoubleClick={() => props.onTaskDoubleClick(task)}
                      // card && card.taskIds ? card.taskIds.map((taskId) => tasks[taskId]) : [];
                      isTaskEditing= {props.isTaskEditing(task)}
                    />
                  ))}
                </TaskList>
                {provided.placeholder}
              </Fragment>
            )}
  </Droppable>
)}
          <NewTaskBar>
            {isAddingNewTask ? (
              <EditInput
                key="newtask"
                value=""
                onSave={onSaveTask}
                margin="8px"
              />
            ) : (
              <NewTaskButton onClick={() => setIsAddingNewTask(true)}>
                + New Task
              </NewTaskButton>
            )}
          </NewTaskBar>
        </CardContainer>
      )}
    </Draggable>
  );
}

const TaskContainer = styled.div`
  display: flex;
`;
const TaskContent = styled.div`
  border: 1px solid lightgrey;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: ${(props) => (props.isDragging ? "lightgreen" : "white")};
  width: 100%;
`;
function Task(props) {
  return (
    <TaskContainer>
      {props.isTaskEditing ? (
        <EditInput
          key={props.task.id}
          value={props.task.content}
          onSave={props.onSaveTaskEdit}
          margin="0 0 8px 0"
        />
      ) : (
        <Draggable draggableId={props.task.id} index={props.index}>
          {(provided, snapshot) => (
            <TaskContent
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              ref={provided.innerRef}
              isDragging={snapshot.isDragging}
              onDoubleClick={props.onTaskDoubleClick}
            >
              {props.task.content}
            </TaskContent>
          )}
        </Draggable>
      )}
    </TaskContainer>
  );
}

const Input = styled.input`
  font-size: ${(props) => props.fontSize || "inherit"};
  font-family: inherit;
  margin: ${(props) => props.margin || "inherit"};
  padding: 8px;
  width: 100%;
`;
function EditInput(props) {
  const [val, setVal] = useState(props.value);
  return (
    <Input
      type="text"
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyPress={(event) => {
        if (event.key === "Enter" || event.key === "Escape") {
          props.onSave(val);
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onBlur={() => props.onSave(val)}
      fontSize={props.fontSize}
      margin={props.margin}
    />
  );
}

function genRandomID() {
  return (Math.random() + 1).toString(36).substring(7);
}

export default Board;
