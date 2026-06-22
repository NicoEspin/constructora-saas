'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export interface EditableStageTask {
  title: string;
  completed?: boolean;
}

interface StageTasksEditorProps {
  tasks: EditableStageTask[];
  onChange: (tasks: EditableStageTask[]) => void;
  allowCompletion?: boolean;
  emptyMessage?: string;
}

export function StageTasksEditor({
  tasks,
  onChange,
  allowCompletion = false,
  emptyMessage = 'Todavía no hay tareas cargadas.',
}: StageTasksEditorProps) {
  const [newTask, setNewTask] = useState('');

  function updateTask(index: number, nextTask: EditableStageTask) {
    onChange(tasks.map((task, taskIndex) => (taskIndex === index ? nextTask : task)));
  }

  function removeTask(index: number) {
    onChange(tasks.filter((_, taskIndex) => taskIndex !== index));
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) {
      return;
    }

    onChange([...tasks, allowCompletion ? { title, completed: false } : { title }]);
    setNewTask('');
  }

  return (
    <div className='flex flex-col gap-3'>
      {tasks.length === 0 ? (
        <div className='rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground'>
          {emptyMessage}
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {tasks.map((task, index) => (
            <div key={`${index}-${task.title}`} className='flex items-center gap-2'>
              {allowCompletion ? (
                <Checkbox
                  checked={Boolean(task.completed)}
                  onCheckedChange={(checked) =>
                    updateTask(index, { ...task, completed: checked === true })
                  }
                />
              ) : null}
              <Input
                value={task.title}
                onChange={(event) => updateTask(index, { ...task, title: event.target.value })}
                placeholder={`Tarea ${index + 1}`}
              />
              <Button type='button' variant='ghost' size='icon' onClick={() => removeTask(index)}>
                <Icons.trash className='h-4 w-4' />
                <span className='sr-only'>Eliminar tarea</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className='flex items-center gap-2'>
        <Input
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTask();
            }
          }}
          placeholder='Nueva tarea'
        />
        <Button type='button' variant='outline' onClick={addTask}>
          <Icons.add className='h-4 w-4' />
          Agregar
        </Button>
      </div>
    </div>
  );
}
