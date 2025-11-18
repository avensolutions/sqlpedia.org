---
title: StackQL - Query Cloud Infrastructure with SQL
description: Use SQL to query and manage cloud infrastructure and SaaS applications
difficulty: intermediate
tags: [stackql, infrastructure-as-code, cloud, devops]
---

# StackQL

## Overview

[StackQL](https://stackql.io/) is an innovative tool that allows you to query, analyze, and interact with cloud infrastructure and SaaS applications using SQL. Instead of using different CLIs, SDKs, or APIs for each provider, you can use standard SQL to work with resources across AWS, Google Cloud, Azure, GitHub, and many other providers.

### Why StackQL?

- **Unified Interface**: Use SQL for all cloud providers and SaaS applications
- **Infrastructure Analysis**: Query and analyze your cloud resources like a database
- **Infrastructure as Code**: Provision and manage infrastructure using SQL
- **Integration**: Works with existing SQL tools and workflows
- **Open Source**: Free and open source

## Getting Started

### Installation

::: code-group

```bash [macOS]
brew install stackql
```

```bash [Linux]
curl -L https://bit.ly/stackql-zip -o stackql.zip
unzip stackql.zip
chmod +x stackql
sudo mv stackql /usr/local/bin/
```

```bash [Windows]
# Download from https://releases.stackql.io/
# Extract and add to PATH
```

```bash [Docker]
docker pull stackql/stackql
docker run -it stackql/stackql shell
```

:::

### Basic Usage

```bash
# Start interactive shell
stackql shell

# Execute query
stackql exec "SELECT region, instanceType, instanceId FROM aws.ec2.instances WHERE region = 'us-east-1'"

# Save output to file
stackql exec --output=json "SELECT * FROM google.compute.instances" > instances.json
```

## Querying Cloud Resources

### AWS Examples

```sql
-- List all EC2 instances
SELECT
  region,
  instanceId,
  instanceType,
  state,
  publicIpAddress
FROM aws.ec2.instances
WHERE region = 'us-east-1';

-- Find large instances
SELECT
  instanceId,
  instanceType,
  state
FROM aws.ec2.instances
WHERE region = 'us-east-1'
  AND instanceType LIKE 'r5.%'
ORDER BY instanceType;

-- List S3 buckets
SELECT
  name,
  creationDate,
  region
FROM aws.s3.buckets;

-- Analyze RDS instances
SELECT
  dbInstanceIdentifier,
  dbInstanceClass,
  engine,
  engineVersion,
  allocatedStorage,
  multiAZ
FROM aws.rds.db_instances
WHERE region = 'us-east-1';
```

### Google Cloud Examples

```sql
-- List Compute Engine instances
SELECT
  name,
  zone,
  machineType,
  status,
  JSON_EXTRACT(networkInterfaces, '$[0].accessConfigs[0].natIP') as publicIP
FROM google.compute.instances
WHERE project = 'my-project'
  AND zone = 'us-central1-a';

-- List Cloud Storage buckets
SELECT
  name,
  location,
  storageClass,
  timeCreated
FROM google.storage.buckets
WHERE project = 'my-project';

-- BigQuery datasets
SELECT
  datasetId,
  location,
  creationTime
FROM google.bigquery.datasets
WHERE projectId = 'my-project';
```

### Azure Examples

```sql
-- List Virtual Machines
SELECT
  name,
  location,
  vmSize,
  provisioningState
FROM azure.compute.virtual_machines
WHERE resourceGroupName = 'my-resource-group'
  AND subscriptionId = 'sub-id';

-- List Storage Accounts
SELECT
  name,
  location,
  kind,
  sku
FROM azure.storage.storage_accounts
WHERE subscriptionId = 'sub-id';
```

### GitHub Examples

```sql
-- List repositories
SELECT
  name,
  description,
  language,
  stargazers_count,
  forks_count,
  open_issues_count
FROM github.repos.repos
WHERE org = 'my-organization';

-- List workflow runs
SELECT
  id,
  name,
  status,
  conclusion,
  created_at,
  updated_at
FROM github.actions.workflow_runs
WHERE owner = 'my-org'
  AND repo = 'my-repo';

-- List issues
SELECT
  number,
  title,
  state,
  created_at,
  user_login
FROM github.issues.issues
WHERE owner = 'my-org'
  AND repo = 'my-repo'
  AND state = 'open';
```

## Cross-Cloud Queries

One of StackQL's most powerful features is the ability to query across multiple cloud providers in a single query.

```sql
-- Compare compute instances across clouds
SELECT
  'AWS' as provider,
  region as location,
  instanceType as size,
  COUNT(*) as count
FROM aws.ec2.instances
WHERE region = 'us-east-1'
GROUP BY instanceType

UNION ALL

SELECT
  'Google Cloud' as provider,
  zone as location,
  machineType as size,
  COUNT(*) as count
FROM google.compute.instances
WHERE project = 'my-project'
  AND zone LIKE 'us-central1-%'
GROUP BY machineType

UNION ALL

SELECT
  'Azure' as provider,
  location,
  vmSize as size,
  COUNT(*) as count
FROM azure.compute.virtual_machines
WHERE subscriptionId = 'sub-id'
  AND location = 'eastus'
GROUP BY vmSize;
```

## Infrastructure as Code with StackQL

### Provisioning Resources

```sql
-- Create an S3 bucket
INSERT INTO aws.s3.buckets (
  Bucket,
  CreateBucketConfiguration
)
SELECT
  'my-new-bucket',
  '{"LocationConstraint": "us-west-2"}';

-- Create EC2 instance
INSERT INTO aws.ec2.instances (
  ImageId,
  InstanceType,
  MaxCount,
  MinCount,
  region
)
SELECT
  'ami-0c55b159cbfafe1f0',
  't3.micro',
  1,
  1,
  'us-east-1';

-- Create GCP Compute instance
INSERT INTO google.compute.instances (
  name,
  machineType,
  disks,
  networkInterfaces,
  project,
  zone
)
SELECT
  'my-instance',
  'zones/us-central1-a/machineTypes/n1-standard-1',
  '[{"boot": true, "initializeParams": {"sourceImage": "projects/debian-cloud/global/images/family/debian-11"}}]',
  '[{"network": "global/networks/default"}]',
  'my-project',
  'us-central1-a';
```

### Updating Resources

```sql
-- Update EC2 instance tags
UPDATE aws.ec2.instances
SET Tags = '[{"Key": "Environment", "Value": "Production"}]'
WHERE instanceId = 'i-1234567890abcdef0'
  AND region = 'us-east-1';
```

### Deleting Resources

```sql
-- Delete S3 bucket
DELETE FROM aws.s3.buckets
WHERE Bucket = 'my-old-bucket';

-- Terminate EC2 instance
DELETE FROM aws.ec2.instances
WHERE instanceId = 'i-1234567890abcdef0'
  AND region = 'us-east-1';
```

## Cost Analysis

```sql
-- AWS cost analysis
SELECT
  region,
  instanceType,
  COUNT(*) as instance_count,
  -- Estimated monthly cost (example pricing)
  CASE instanceType
    WHEN 't3.micro' THEN COUNT(*) * 7.30
    WHEN 't3.small' THEN COUNT(*) * 14.60
    WHEN 't3.medium' THEN COUNT(*) * 29.20
    WHEN 'm5.large' THEN COUNT(*) * 69.35
    ELSE COUNT(*) * 100
  END as estimated_monthly_cost
FROM aws.ec2.instances
WHERE state = 'running'
GROUP BY region, instanceType
ORDER BY estimated_monthly_cost DESC;
```

## Security Auditing

```sql
-- Find publicly accessible S3 buckets
SELECT
  name,
  creationDate
FROM aws.s3.buckets b
WHERE EXISTS (
  SELECT 1
  FROM aws.s3.bucket_acls a
  WHERE a.Bucket = b.name
    AND JSON_EXTRACT(a.Grants, '$[*].Grantee.URI') LIKE '%AllUsers%'
);

-- Find security groups with unrestricted access
SELECT
  groupId,
  groupName,
  vpcId
FROM aws.ec2.security_groups
WHERE region = 'us-east-1'
  AND JSON_EXTRACT(ipPermissions, '$[*].ipRanges[*].cidrIp') LIKE '%0.0.0.0/0%';
```

## Integration Examples

### Generate Reports

```sql
-- Generate infrastructure inventory report
SELECT
  'AWS EC2' as resource_type,
  region as location,
  COUNT(*) as count
FROM aws.ec2.instances
GROUP BY region

UNION ALL

SELECT
  'AWS RDS' as resource_type,
  region as location,
  COUNT(*) as count
FROM aws.rds.db_instances
GROUP BY region

ORDER BY resource_type, location;
```

### Terraform Integration

StackQL can complement Terraform by providing query capabilities for infrastructure analysis.

```bash
# Query resources managed by Terraform
stackql exec "SELECT * FROM aws.ec2.instances WHERE JSON_EXTRACT(tags, '$[?(@.key==\"ManagedBy\")].value') = 'terraform'"
```

## StackQL Providers

StackQL supports numerous providers:

- **Cloud Platforms**: AWS, Google Cloud, Azure, DigitalOcean, Linode
- **Kubernetes**: Query K8s resources using SQL
- **SaaS Applications**: GitHub, GitLab, Datadog, PagerDuty, Okta
- **Databases**: Query database metadata
- **And many more...**

View all providers: [https://registry.stackql.io/](https://registry.stackql.io/)

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [StackQL Documentation](https://stackql.io/docs)
- [StackQL Registry](https://registry.stackql.io/)
- [StackQL GitHub](https://github.com/stackql/stackql)
- [Cloud APIs](/stackql/cloud-apis) - Detailed cloud provider examples
- [Infrastructure Examples](/stackql/infrastructure) - Infrastructure as Code patterns
