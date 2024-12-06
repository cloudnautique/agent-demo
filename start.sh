$!/bin/sh

python migrate.py

python agent_api.py &
python customer_api.py &

cd agent-frontend
npm run dev &
cd ..

cd frontend
npm run dev:api &
cd ..

wait
