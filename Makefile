start:
	docker-compose up -d 

stop:
	docker-compose down

restart:
	make stop && make start

build:
	docker-compose up -d --build