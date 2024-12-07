$!/bin/sh

python migrate.py

python agent_api.py &
python customer_api.py &

cd agent-frontend
pnpm start &
cd ..

sleep 1

cd frontend
pnpm start &
cd ..

wait
