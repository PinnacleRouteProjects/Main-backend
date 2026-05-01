const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = (port, attemptsLeft = 10) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
      startServer(port + 1, attemptsLeft - 1);
      return;
    }

    throw error;
  });
};

startServer(PORT);
