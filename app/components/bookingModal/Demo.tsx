import { Button } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';

export default function Demo() {
  return(

  <>
    <DateTimePicker label="Start tidspunkt" placeholder="Start tidspunkt" />

    <DateTimePicker label="Slut tidspunkt" placeholder="Slut tidspunkt" />

    <Button>Book</Button>
  </>
  );
}