import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import ComandoManager from './src/Comando/ComandosManager';

const app = express();
const port = 3001;

app.use(cors())

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('URL: ', req.url)
  next()
})

app.get('/command', (req, res) => {
  try {
    const command = req.query.command
    if (typeof command !== 'string') {
      throw new Error('Comando inválido')
    }
    const content = ComandoManager.getInstance().ejecutarComando(command)
    return res.status(200).send({
      command,
      content
    });
  } catch (error) {
    return res.status(400).send({
      error
    });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});
