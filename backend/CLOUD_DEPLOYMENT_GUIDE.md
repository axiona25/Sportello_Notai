# ☁️ CLOUD DEPLOYMENT GUIDE

Guida completa per deploy su AWS, GCP e Azure con auto-scaling.

---

## 🌐 ARCHITETTURA CLOUD

### Stack Completo
```
Internet
   ↓
CDN (CloudFront/CloudFlare)
   ↓
Load Balancer (ALB/GLB)
   ↓
Application Tier (Auto-scaling)
   ├── Django (ECS Fargate / Cloud Run / App Service)
   ├── Celery Workers
   └── Celery Beat
   ↓
Data Tier
   ├── PostgreSQL (RDS / Cloud SQL / Azure DB)
   ├── Redis (ElastiCache / Memorystore / Azure Cache)
   └── S3 (S3 / GCS / Blob Storage)
```

---

## 🔶 AWS DEPLOYMENT

### 1. Setup Infrastructure

#### RDS PostgreSQL
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier sportello-notai-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --multi-az \
  --enable-cloudwatch-logs-exports '["postgresql"]'
```

#### ElastiCache Redis
```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id sportello-notai-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --engine-version 7.0
```

#### S3 Bucket
```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket sportello-notai-docs \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket sportello-notai-docs \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 2. Build & Push Image

```bash
# Create ECR repository
aws ecr create-repository --repository-name sportello-notai

# Login to ECR
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.eu-west-1.amazonaws.com

# Build image
docker build -t sportello-notai:latest .

# Tag & push
docker tag sportello-notai:latest \
  <account-id>.dkr.ecr.eu-west-1.amazonaws.com/sportello-notai:latest
docker push <account-id>.dkr.ecr.eu-west-1.amazonaws.com/sportello-notai:latest
```

### 3. ECS Setup

#### Task Definition
```json
{
  "family": "sportello-notai",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [{
    "name": "django",
    "image": "<account-id>.dkr.ecr.eu-west-1.amazonaws.com/sportello-notai:latest",
    "portMappings": [{
      "containerPort": 8001,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "DEBUG", "value": "False"},
      {"name": "ALLOWED_HOSTS", "value": "*"},
      {"name": "DB_HOST", "value": "<rds-endpoint>"},
      {"name": "REDIS_URL", "value": "redis://<elasticache-endpoint>:6379/0"}
    ],
    "secrets": [
      {"name": "SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:..."},
      {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."}
    ],
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:8001/health/ || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 60
    },
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/sportello-notai",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "django"
      }
    }
  }]
}
```

#### Create Service
```bash
aws ecs create-service \
  --cluster sportello-notai \
  --service-name backend \
  --task-definition sportello-notai:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration '{
    "awsvpcConfiguration": {
      "subnets": ["subnet-xxx", "subnet-yyy"],
      "securityGroups": ["sg-xxx"],
      "assignPublicIp": "ENABLED"
    }
  }' \
  --load-balancers '[{
    "targetGroupArn": "arn:aws:elasticloadbalancing:...",
    "containerName": "django",
    "containerPort": 8001
  }]'
```

### 4. Auto-Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/sportello-notai/backend \
  --min-capacity 2 \
  --max-capacity 10

# CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/sportello-notai/backend \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }'
```

### 5. CloudFront CDN

```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "sportello-notai-'$(date +%s)'",
  "Comment": "Sportello Notai CDN",
  "Origins": {
    "Items": [{
      "Id": "S3-sportello-notai-docs",
      "DomainName": "sportello-notai-docs.s3.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-sportello-notai-docs",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "DefaultTTL": 86400
  },
  "Enabled": true
}'
```

---

## 🔵 GCP DEPLOYMENT

### 1. Cloud SQL PostgreSQL
```bash
gcloud sql instances create sportello-notai-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=europe-west1 \
  --storage-auto-increase
```

### 2. Cloud Run
```bash
# Build image
gcloud builds submit --tag gcr.io/<project-id>/sportello-notai

# Deploy
gcloud run deploy sportello-notai \
  --image gcr.io/<project-id>/sportello-notai \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars DEBUG=False \
  --set-cloudsql-instances <instance-connection-name>
```

### 3. Memorystore Redis
```bash
gcloud redis instances create sportello-notai-redis \
  --size=1 \
  --region=europe-west1 \
  --redis-version=redis_7_0
```

---

## 🔷 AZURE DEPLOYMENT

### 1. Azure Database for PostgreSQL
```bash
az postgres server create \
  --resource-group sportello-notai \
  --name sportello-notai-db \
  --location westeurope \
  --admin-user postgres \
  --admin-password <secure-password> \
  --sku-name B_Gen5_1 \
  --storage-size 51200
```

### 2. Azure Container Instances
```bash
# Create container registry
az acr create --resource-group sportello-notai \
  --name sportellonotai --sku Basic

# Build & push
az acr build --registry sportellonotai \
  --image sportello-notai:latest .

# Deploy
az container create \
  --resource-group sportello-notai \
  --name sportello-notai-backend \
  --image sportellonotai.azurecr.io/sportello-notai:latest \
  --cpu 1 --memory 2 \
  --ports 8001 \
  --environment-variables DEBUG=False
```

### 3. Azure Cache for Redis
```bash
az redis create \
  --location westeurope \
  --name sportello-notai-redis \
  --resource-group sportello-notai \
  --sku Basic --vm-size c0
```

---

## 🔥 PERFORMANCE TUNING

### Gunicorn Configuration
```python
# gunicorn.conf.py
import multiprocessing

bind = "0.0.0.0:8001"
workers = multiprocessing.cpu_count() * 2 + 1  # (cores * 2) + 1
worker_class = "gevent"
worker_connections = 1000
max_requests = 10000
max_requests_jitter = 1000
timeout = 30
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Performance
preload_app = True  # Load app before forking workers
```

### Database Connection Pooling
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django_db_connection_pool.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'POOL_OPTIONS': {
            'POOL_SIZE': 20,
            'MAX_OVERFLOW': 10,
            'TIMEOUT': 30,
            'RECYCLE': 3600,
        }
    }
}

# Or use PgBouncer for enterprise scale
# Connection string: postgresql://user:pass@pgbouncer:6432/db
```

---

## 📊 COST ESTIMATION

### AWS (eu-west-1)
| Service | Config | Monthly Cost |
|---------|--------|-------------|
| ECS Fargate | 2-10 tasks (1 vCPU, 2GB) | $60-300 |
| RDS PostgreSQL | db.t3.medium Multi-AZ | $80 |
| ElastiCache | cache.t3.small | $30 |
| S3 + CloudFront | 500GB | $60 |
| ALB | Standard | $20 |
| **TOTAL** | | **$250-490** |

### GCP (europe-west1)
| Service | Config | Monthly Cost |
|---------|--------|-------------|
| Cloud Run | 1-10 instances (2GB) | $50-250 |
| Cloud SQL | db-n1-standard-1 | $70 |
| Memorystore | 1GB Redis | $25 |
| Cloud Storage + CDN | 500GB | $50 |
| Load Balancer | Standard | $18 |
| **TOTAL** | | **$213-413** |

### Azure (West Europe)
| Service | Config | Monthly Cost |
|---------|--------|-------------|
| App Service | P1v2 (2 instances) | $140 |
| Azure DB PostgreSQL | B_Gen5_1 | $60 |
| Azure Cache Redis | C0 | $16 |
| Blob Storage + CDN | 500GB | $45 |
| **TOTAL** | | **$261** |

---

## 🎯 SCALABILITY TARGETS

### Initial Capacity
- **Users**: 1,000-10,000 attivi
- **Concurrent**: 100-500 utenti simultanei
- **RPS**: 500-1000 req/s
- **Storage**: 100GB documenti

### Growth (6-12 mesi)
- **Users**: 50,000-100,000 attivi
- **Concurrent**: 1,000-5,000 utenti simultanei
- **RPS**: 5,000-10,000 req/s
- **Storage**: 1TB documenti

### Auto-Scaling Rules
```yaml
Scale Out (Add Instances):
  - CPU > 70% for 2 minutes
  - Memory > 80% for 2 minutes
  - Request latency P95 > 1s
  - Queue depth > 100

Scale In (Remove Instances):
  - CPU < 30% for 5 minutes
  - Memory < 40% for 5 minutes
  - After cooldown period (5 min)

Limits:
  - Min instances: 2 (HA)
  - Max instances: 10 (cost control)
```

---

## 🚀 DEPLOYMENT STEPS (AWS)

### Step 1: Prerequisites
```bash
# Install AWS CLI
pip install awscli
aws configure

# Install Terraform (optional)
brew install terraform  # Mac
# or
apt-get install terraform  # Linux
```

### Step 2: Create VPC & Networking
```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets (multi-AZ)
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 --availability-zone eu-west-1a
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.2.0/24 --availability-zone eu-west-1b

# Create security groups
aws ec2 create-security-group --group-name sportello-notai-backend --description "Backend SG" --vpc-id <vpc-id>
```

### Step 3: Deploy Database
```bash
# Already shown in section 1
```

### Step 4: Deploy Application
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name sportello-notai

# Register task definition (JSON above)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service with auto-scaling
aws ecs create-service --cli-input-json file://service-definition.json
```

### Step 5: Configure Load Balancer
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name sportello-notai-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing

# Create target group
aws elbv2 create-target-group \
  --name sportello-notai-tg \
  --protocol HTTP \
  --port 8001 \
  --vpc-id <vpc-id> \
  --target-type ip \
  --health-check-path /health/ \
  --health-check-interval-seconds 30

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<acm-cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<tg-arn>
```

### Step 6: Setup Auto-Scaling
```bash
# Already shown in Auto-Scaling section
```

### Step 7: Configure CloudWatch
```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/sportello-notai

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name sportello-notai-high-cpu \
  --alarm-description "CPU > 70%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 120 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 🔄 CI/CD PIPELINE

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      
      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build & Push
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/sportello-notai:$IMAGE_TAG .
          docker push $ECR_REGISTRY/sportello-notai:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster sportello-notai \
            --service backend \
            --force-new-deployment
```

---

## 📈 MONITORING & ALERTS

### CloudWatch Dashboards
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization"],
          [".", "MemoryUtilization"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "eu-west-1",
        "title": "ECS Performance"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "TargetResponseTime"],
          [".", "RequestCount"]
        ],
        "title": "API Performance"
      }
    }
  ]
}
```

### Datadog Integration (Raccomandato)
```python
# settings.py
DATADOG_TRACE = {
    'DEFAULT_SERVICE': 'sportello-notai',
    'TAGS': {'env': 'production'},
}
```

---

## 🔐 SECRETS MANAGEMENT

### AWS Secrets Manager
```bash
# Create secret
aws secretsmanager create-secret \
  --name sportello-notai/prod/django \
  --secret-string '{
    "SECRET_KEY": "...",
    "DB_PASSWORD": "...",
    "JWT_SECRET_KEY": "...",
    "AWS_ACCESS_KEY_ID": "...",
    "AWS_SECRET_ACCESS_KEY": "..."
  }'

# Use in ECS task
"secrets": [
  {
    "name": "SECRET_KEY",
    "valueFrom": "arn:aws:secretsmanager:eu-west-1:xxx:secret:sportello-notai/prod/django:SECRET_KEY::"
  }
]
```

---

## 🧪 TESTING

### Load Test Commands
```bash
# Local testing
locust -f locustfile.py --host http://localhost:8001

# Production testing (be careful!)
locust -f locustfile.py --host https://api.sportello-notai.com \
  --users 100 --spawn-rate 10 --run-time 5m --headless

# Generate report
locust -f locustfile.py --host https://api.sportello-notai.com \
  --users 500 --spawn-rate 50 --run-time 10m --headless \
  --html report.html
```

### Expected Results
- ✅ P95 latency < 500ms
- ✅ Error rate < 0.1%
- ✅ Throughput > 1000 req/s
- ✅ 99.9% uptime

---

## 📚 BEST PRACTICES

### Database
- ✅ Use connection pooling (pgbouncer or django-db-connection-pool)
- ✅ Enable read replicas for heavy read workloads
- ✅ Regular VACUUM and ANALYZE
- ✅ Monitor slow queries (> 100ms)

### Caching
- ✅ Cache API responses (15 min TTL)
- ✅ Cache database queries
- ✅ Implement cache warming
- ✅ Use Redis clustering for HA

### Application
- ✅ Use Gunicorn with gevent workers
- ✅ Enable GZip compression
- ✅ Optimize ORM queries (select_related/prefetch_related)
- ✅ Use pagination (already configured)

### Monitoring
- ✅ Health checks configured
- ✅ Prometheus metrics exposed
- ✅ Centralized logging (CloudWatch/Stackdriver)
- ✅ Alert on errors and slow responses

---

**Deploy checklist completo! Sistema pronto per production cloud! ☁️🚀**

*Ultimo aggiornamento: 2025-10-07*  
*Versione: 1.2 - Cloud-Ready*

