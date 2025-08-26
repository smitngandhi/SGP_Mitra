#  Mitra - Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying  Mitra in various environments, from development to production-ready deployments with high availability and scalability.

## 📋 Pre-Deployment Checklist

### Environment Requirements
- [ ] **Python 3.8+** installed
- [ ] **Node.js 16+** and npm
- [ ] **MongoDB** database (local/Atlas)
- [ ] **SSL certificates** for HTTPS
- [ ] **Domain name** configured
- [ ] **API keys** for external services

### Security Checklist
- [ ] Environment variables secured
- [ ] Database credentials encrypted
- [ ] JWT secrets generated
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented

## 🏠 Local Development Deployment

### Quick Start
```bash
# Clone and setup
git clone -b Smit https://github.com/your-username/_Mitra.git
cd _Mitra-main

# Backend setup
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Frontend setup (new terminal)
cd frontend
npm install

# Environment configuration
cp .env.example .env
# Edit .env with your configuration

# Start services
python run.py  # Backend on :5000
npm start      # Frontend on :3000 (in frontend/)
```

### Development Environment Variables
```env
# Development .env
FLASK_ENV=development
DEBUG=True
MONGO_URL=mongodb://localhost:27017/_mitra_dev
MONGO_DB_NAME=_mitra_dev
JWT_SECRET_KEY=dev_secret_key_change_in_production
TOGETHER_API_KEY=your_together_ai_key
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## 🐳 Docker Deployment

### Docker Compose Setup
Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: _mitra_mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: _mitra
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"
    networks:
      - _network

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: _mitra_backend
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
      - MONGO_URL=mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb:27017/_mitra?authSource=admin
    env_file:
      - .env.production
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    volumes:
      - ./logs:/app/logs
      - ./app/static:/app/app/static
    networks:
      - _network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: _mitra_frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api/v1
    networks:
      - _network

  nginx:
    image: nginx:alpine
    container_name: _mitra_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - _network

volumes:
  mongodb_data:

networks:
  _network:
    driver: bridge
```

### Backend Dockerfile
Create `Dockerfile.backend`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "run:app"]
```

### Frontend Dockerfile
Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Auth endpoints with stricter rate limiting
        location /api/v1/login {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Static files
        location /static/ {
            proxy_pass http://backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Deploy with Docker Compose
```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3

# Update deployment
docker-compose pull
docker-compose up -d --force-recreate
```

## ☁️ Cloud Deployment

### AWS Deployment

#### EC2 Instance Setup
```bash
# Launch EC2 instance (Ubuntu 20.04 LTS)
# Security groups: HTTP (80), HTTPS (443), SSH (22)

# Connect and setup
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu

# Clone repository
git clone -b Smit https://github.com/your-username/_Mitra.git
cd _Mitra-main

# Setup environment
cp .env.example .env.production
# Edit .env.production with production values

# Deploy
docker-compose up -d
```

#### AWS RDS MongoDB Setup
```bash
# Use Amazon DocumentDB (MongoDB-compatible)
# Connection string example:
MONGO_URL=mongodb://username:password@docdb-cluster.cluster-xyz.us-east-1.docdb.amazonaws.com:27017/_mitra?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
```

#### AWS S3 for Static Files
```python
# app/config.py - S3 configuration
import boto3

class ProductionConfig:
    S3_BUCKET = '-mitra-static'
    S3_REGION = 'us-east-1'
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
```

### Google Cloud Platform Deployment

#### Cloud Run Deployment
```yaml
# cloudbuild.yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/-mitra-backend', '-f', 'Dockerfile.backend', '.']
  
  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/-mitra-frontend', './frontend']
  
  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/-mitra-backend']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/-mitra-frontend']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', '-mitra-backend', 
           '--image', 'gcr.io/$PROJECT_ID/-mitra-backend',
           '--platform', 'managed',
           '--region', 'us-central1',
           '--allow-unauthenticated']
```

### Heroku Deployment

#### Heroku Setup
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create applications
heroku create -mitra-backend
heroku create -mitra-frontend

# Backend deployment
git subtree push --prefix=. heroku main

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set MONGO_URL=your_mongodb_atlas_url
heroku config:set JWT_SECRET_KEY=your_production_secret

# Frontend deployment
cd frontend
heroku create -mitra-frontend
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a -mitra-frontend
git push heroku main
```

#### Procfile
Create `Procfile`:
```
web: gunicorn --bind 0.0.0.0:$PORT run:app
```

## 🗄️ Database Deployment

### MongoDB Atlas (Recommended)
```bash
# 1. Create MongoDB Atlas cluster
# 2. Configure network access (IP whitelist)
# 3. Create database user
# 4. Get connection string

# Connection string format:
mongodb+srv://username:password@cluster.mongodb.net/_mitra?retryWrites=true&w=majority
```

### Self-Hosted MongoDB
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
mongo
> use admin
> db.createUser({user: "admin", pwd: "secure_password", roles: ["root"]})
> exit

# Enable authentication
sudo nano /etc/mongod.conf
# Add: security.authorization: enabled
sudo systemctl restart mongod
```

### Database Backup Strategy
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="_mitra"

# Create backup
mongodump --host localhost --db $DB_NAME --out $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/_mitra_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "_mitra_*.tar.gz" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/_mitra_$DATE.tar.gz s3://your-backup-bucket/mongodb/
```

## 🔒 Production Security

### SSL/TLS Configuration
```bash
# Let's Encrypt SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Environment Variables Security
```bash
# Use secrets management
# AWS Secrets Manager
aws secretsmanager create-secret --name -mitra/prod --secret-string file://secrets.json

# Google Secret Manager
gcloud secrets create -mitra-secrets --data-file=secrets.json

# Azure Key Vault
az keyvault secret set --vault-name -mitra-vault --name secrets --file secrets.json
```

### Firewall Configuration
```bash
# UFW firewall setup
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5000/tcp  # Block direct backend access
```

## 📊 Monitoring & Logging

### Application Monitoring
```python
# app/monitoring.py
from prometheus_client import Counter, Histogram, generate_latest
import time

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    REQUEST_COUNT.labels(method=request.method, endpoint=request.endpoint).inc()
    REQUEST_LATENCY.observe(time.time() - request.start_time)
    return response

@app.route('/metrics')
def metrics():
    return generate_latest()
```

### Log Aggregation
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:7.14.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### Health Checks
```python
# app/health.py
@app.route('/health')
def health_check():
    checks = {
        'database': check_database(),
        'ai_service': check_ai_service(),
        'external_apis': check_external_apis()
    }
    
    status = 'healthy' if all(checks.values()) else 'unhealthy'
    status_code = 200 if status == 'healthy' else 503
    
    return jsonify({
        'status': status,
        'checks': checks,
        'timestamp': datetime.utcnow().isoformat()
    }), status_code
```

## 🔄 CI/CD Pipeline

### GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy  Mitra

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
          
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          
      - name: Run tests
        run: |
          python -m pytest tests/
          
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 16
          
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
          
      - name: Run frontend tests
        run: |
          cd frontend
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to production
        run: |
          # Add your deployment commands here
          echo "Deploying to production..."
```

## 📈 Scaling Considerations

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  backend:
    deploy:
      replicas: 3
    
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
```

### Load Balancer Configuration
```nginx
# nginx-lb.conf
upstream backend_pool {
    least_conn;
    server backend_1:5000;
    server backend_2:5000;
    server backend_3:5000;
}

server {
    location /api/ {
        proxy_pass http://backend_pool;
    }
}
```

### Database Scaling
```javascript
// MongoDB replica set configuration
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
})
```

## 🚨 Disaster Recovery

### Backup Strategy
```bash
#!/bin/bash
# backup.sh - Comprehensive backup script

# Database backup
mongodump --uri="$MONGO_URL" --out="/backups/db/$(date +%Y%m%d)"

# Application files backup
tar -czf "/backups/app/app_$(date +%Y%m%d).tar.gz" /app

# Upload to cloud storage
aws s3 sync /backups s3://-mitra-backups/

# Cleanup old backups
find /backups -type f -mtime +30 -delete
```

### Recovery Procedures
```bash
# Database recovery
mongorestore --uri="$MONGO_URL" /backups/db/20240115

# Application recovery
tar -xzf /backups/app/app_20240115.tar.gz -C /

# Restart services
docker-compose restart
```

## 📋 Post-Deployment Checklist

### Verification Steps
- [ ] Application accessible via HTTPS
- [ ] Database connections working
- [ ] AI services responding
- [ ] Authentication flow functional
- [ ] File uploads working
- [ ] Email notifications sending
- [ ] Monitoring dashboards active
- [ ] Backup systems running
- [ ] SSL certificates valid
- [ ] Performance metrics within limits

### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://your-domain.com/api/v1/health

# Stress testing with Artillery
artillery quick --count 10 --num 100 https://your-domain.com/
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MongoDB status
docker-compose logs mongodb

# Test connection
mongo "mongodb://username:password@host:port/database"
```

#### Memory Issues
```bash
# Monitor memory usage
docker stats

# Increase container memory limits
docker-compose up -d --scale backend=2
```

#### SSL Certificate Issues
```bash
# Check certificate status
openssl x509 -in /etc/ssl/certs/cert.pem -text -noout

# Renew Let's Encrypt certificate
certbot renew --dry-run
```

---

## 📞 Support

For deployment support:
- **Documentation**: https://docs.mitra.com/deployment
- **Issues**: https://github.com/your-username/_Mitra/issues
- **Email**: devops@mitra.com
