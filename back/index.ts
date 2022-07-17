import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors())

app.use((req: Request, res: Response, next ) => {
  console.log('URL: ', req.url)
  next()
})

app.get('/command', (req, res) => {
  return res.status(200).send({
    command: req.query.command,
    content: req.query.command
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});
