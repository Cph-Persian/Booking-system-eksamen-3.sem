import { useState } from 'react';
import { DatePicker } from '@mantine/dates';
import { Button } from '@mantine/core';

function Demo() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <>
      <DatePicker value={value} onChange={setValue} />
      <Button>Søg</Button>
    </>
  );
}