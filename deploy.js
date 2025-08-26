// Deployment Script for Cloudflare D1 + Workers Solution
// Automates the deployment process and database setup

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class CloudflareDeployer {
    constructor() {
        this.config = {
            projectName: 'phedel-search',
            databaseName: 'phedel-products-db',
            // r2BucketName: 'phedel-product-images', // REMOVED - using base64 storage in D1
            kvNamespaces: {
                analytics: 'phedel-analytics',
                cache: 'phedel-cache'
            },
            workers: [
                { name: 'search-api', file: 'src/search-api.js', route: '/search/*' },
                { name: 'product-api', file: 'src/product-api.js', route: '/products/*' },
                { name: 'auth-api', file: 'src/auth-api.js', route: '/auth/*' },
                { name: 'upload-api', file: 'src/upload-api.js', route: '/upload/*' }
            ]
        };
        
        this.deploymentSteps = [
            'checkPrerequisites',
            'createD1Database',
            // 'createR2Bucket', // REMOVED - using base64 storage in D1
            'createKVNamespaces',
            'deploySchema',
            'deployWorkers',
            'updateWranglerConfig',
            'testDeployment',
            'displayResults'
        ];
        
        this.results = {
            database: null,
            // bucket: null, // REMOVED - using base64 storage in D1
            kvNamespaces: {},
            workers: {},
            errors: []
        };
    }
    
    async deploy() {
        console.log('🚀 Starting Cloudflare D1 + Workers deployment...');
        console.log('=' .repeat(60));
        
        try {
            for (const step of this.deploymentSteps) {
                console.log(`\n📋 Executing: ${step}`);
                await this[step]();
            }
            
            console.log('\n✅ Deployment completed successfully!');
            return { success: true, results: this.results };
            
        } catch (error) {
            console.error('\n❌ Deployment failed:', error.message);
            this.results.errors.push(error.message);
            return { success: false, error: error.message, results: this.results };
        }
    }
    
    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check if wrangler is installed
        try {
            const wranglerVersion = execSync('wrangler --version', { encoding: 'utf8' });
            console.log(`✅ Wrangler installed: ${wranglerVersion.trim()}`);
        } catch (error) {
            throw new Error('Wrangler CLI not found. Please install it with: npm install -g wrangler');
        }
        
        // Check if user is authenticated
        try {
            execSync('wrangler whoami', { encoding: 'utf8' });
            console.log('✅ Wrangler authentication verified');
        } catch (error) {
            throw new Error('Not authenticated with Cloudflare. Please run: wrangler login');
        }
        
        // Check if required files exist
        const requiredFiles = [
            'wrangler.toml',
            'schema.sql',
            'src/search-api.js',
            'src/product-api.js',
            'src/auth-api.js',
            'src/upload-api.js'
        ];
        
        for (const file of requiredFiles) {
            try {
                await fs.access(file);
                console.log(`✅ Found required file: ${file}`);
            } catch (error) {
                throw new Error(`Required file not found: ${file}`);
            }
        }
    }
    
    async createD1Database() {
        console.log('🗄️ Creating D1 database...');
        
        try {
            const output = execSync(`wrangler d1 create ${this.config.databaseName}`, { encoding: 'utf8' });
            
            // Extract database ID from output
            const dbIdMatch = output.match(/database_id = "([^"]+)"/);
            if (dbIdMatch) {
                this.results.database = {
                    name: this.config.databaseName,
                    id: dbIdMatch[1]
                };
                console.log(`✅ D1 database created: ${this.results.database.id}`);
            } else {
                throw new Error('Could not extract database ID from wrangler output');
            }
            
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️ D1 database already exists, continuing...');
                // Try to get existing database info
                try {
                    const listOutput = execSync('wrangler d1 list', { encoding: 'utf8' });
                    console.log('📋 Existing databases:', listOutput);
                } catch (listError) {
                    console.warn('Could not list existing databases');
                }
            } else {
                throw new Error(`Failed to create D1 database: ${error.message}`);
            }
        }
    }
    
    // REMOVED - R2 bucket creation (using base64 storage in D1)
    // async createR2Bucket() {
    //     console.log('🪣 Creating R2 bucket...');
    //     
    //     try {
    //         execSync(`wrangler r2 bucket create ${this.config.r2BucketName}`, { encoding: 'utf8' });
    //         this.results.bucket = {
    //             name: this.config.r2BucketName
    //         };
    //         console.log(`✅ R2 bucket created: ${this.config.r2BucketName}`);
    //         
    //     } catch (error) {
    //         if (error.message.includes('already exists')) {
    //             console.log('⚠️ R2 bucket already exists, continuing...');
    //             this.results.bucket = { name: this.config.r2BucketName };
    //         } else {
    //             throw new Error(`Failed to create R2 bucket: ${error.message}`);
    //         }
    //     }
    // }
    
    async createKVNamespaces() {
        console.log('🔑 Creating KV namespaces...');
        
        for (const [key, namespaceName] of Object.entries(this.config.kvNamespaces)) {
            try {
                const output = execSync(`wrangler kv:namespace create ${namespaceName}`, { encoding: 'utf8' });
                
                // Extract namespace ID from output
                const nsIdMatch = output.match(/id = "([^"]+)"/);
                if (nsIdMatch) {
                    this.results.kvNamespaces[key] = {
                        name: namespaceName,
                        id: nsIdMatch[1]
                    };
                    console.log(`✅ KV namespace created: ${namespaceName} (${nsIdMatch[1]})`);
                }
                
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`⚠️ KV namespace ${namespaceName} already exists, continuing...`);
                } else {
                    console.warn(`Failed to create KV namespace ${namespaceName}: ${error.message}`);
                }
            }
        }
    }
    
    async deploySchema() {
        console.log('📊 Deploying database schema...');
        
        try {
            // Execute schema on remote database
            execSync(`wrangler d1 execute ${this.config.databaseName} --remote --file=schema.sql`, { encoding: 'utf8' });
            console.log('✅ Database schema deployed successfully');
            
            // Also execute locally for development
            try {
                execSync(`wrangler d1 execute ${this.config.databaseName} --local --file=schema.sql`, { encoding: 'utf8' });
                console.log('✅ Database schema deployed locally');
            } catch (localError) {
                console.warn('⚠️ Local schema deployment failed (this is okay for production)');
            }
            
        } catch (error) {
            throw new Error(`Failed to deploy database schema: ${error.message}`);
        }
    }
    
    async deployWorkers() {
        console.log('⚡ Deploying Workers...');
        
        for (const worker of this.config.workers) {
            try {
                console.log(`📦 Deploying ${worker.name}...`);
                
                // Create a temporary wrangler.toml for this worker
                const workerConfig = await this.createWorkerConfig(worker);
                const tempConfigPath = `wrangler-${worker.name}.toml`;
                
                await fs.writeFile(tempConfigPath, workerConfig);
                
                // Deploy the worker
                const output = execSync(`wrangler deploy ${worker.file} --config ${tempConfigPath}`, { encoding: 'utf8' });
                
                // Extract worker URL from output
                const urlMatch = output.match(/https:\/\/[^\s]+/);
                if (urlMatch) {
                    this.results.workers[worker.name] = {
                        url: urlMatch[0],
                        route: worker.route
                    };
                }
                
                console.log(`✅ Worker deployed: ${worker.name}`);
                
                // Clean up temporary config
                await fs.unlink(tempConfigPath);
                
            } catch (error) {
                console.error(`❌ Failed to deploy worker ${worker.name}: ${error.message}`);
                this.results.errors.push(`Worker ${worker.name}: ${error.message}`);
            }
        }
    }
    
    async createWorkerConfig(worker) {
        // Read the main wrangler.toml
        const mainConfig = await fs.readFile('wrangler.toml', 'utf8');
        
        // Modify for specific worker
        const workerConfig = mainConfig
            .replace(/name = "[^"]+"/, `name = "${this.config.projectName}-${worker.name}"`)
            .replace(/main = "[^"]+"/, `main = "${worker.file}"`);
        
        return workerConfig;
    }
    
    async updateWranglerConfig() {
        console.log('⚙️ Updating wrangler.toml with deployment info...');
        
        try {
            let config = await fs.readFile('wrangler.toml', 'utf8');
            
            // Update database ID if we have it
            if (this.results.database?.id) {
                config = config.replace(
                    /database_id = "[^"]*"/,
                    `database_id = "${this.results.database.id}"`
                );
            }
            
            // Update KV namespace IDs if we have them
            for (const [key, namespace] of Object.entries(this.results.kvNamespaces)) {
                if (namespace.id) {
                    const pattern = new RegExp(`id = "[^"]*".*# ${key}`, 'g');
                    config = config.replace(pattern, `id = "${namespace.id}" # ${key}`);
                }
            }
            
            await fs.writeFile('wrangler.toml', config);
            console.log('✅ wrangler.toml updated with deployment info');
            
        } catch (error) {
            console.warn(`⚠️ Failed to update wrangler.toml: ${error.message}`);
        }
    }
    
    async testDeployment() {
        console.log('🧪 Testing deployment...');
        
        // Test if we can reach the workers
        for (const [workerName, workerInfo] of Object.entries(this.results.workers)) {
            if (workerInfo.url) {
                try {
                    console.log(`🔍 Testing ${workerName} at ${workerInfo.url}`);
                    
                    // Simple health check - just try to reach the worker
                    const response = await fetch(workerInfo.url, {
                        method: 'GET',
                        headers: { 'User-Agent': 'Deployment-Test' }
                    });
                    
                    if (response.status < 500) {
                        console.log(`✅ ${workerName} is responding (status: ${response.status})`);
                    } else {
                        console.warn(`⚠️ ${workerName} returned status ${response.status}`);
                    }
                    
                } catch (error) {
                    console.warn(`⚠️ Could not test ${workerName}: ${error.message}`);
                }
            }
        }
    }
    
    async displayResults() {
        console.log('\n📋 Deployment Results:');
        console.log('=' .repeat(60));
        
        if (this.results.database) {
            console.log(`\n🗄️ D1 Database:`);
            console.log(`   Name: ${this.results.database.name}`);
            console.log(`   ID: ${this.results.database.id}`);
        }
        
        // REMOVED - R2 bucket display (using base64 storage in D1)
        // if (this.results.bucket) {
        //     console.log(`\n🪣 R2 Bucket:`);
        //     console.log(`   Name: ${this.results.bucket.name}`);
        // }
        
        if (Object.keys(this.results.kvNamespaces).length > 0) {
            console.log(`\n🔑 KV Namespaces:`);
            for (const [key, namespace] of Object.entries(this.results.kvNamespaces)) {
                console.log(`   ${key}: ${namespace.name} (${namespace.id})`);
            }
        }
        
        if (Object.keys(this.results.workers).length > 0) {
            console.log(`\n⚡ Workers:`);
            for (const [name, worker] of Object.entries(this.results.workers)) {
                console.log(`   ${name}: ${worker.url}`);
            }
        }
        
        if (this.results.errors.length > 0) {
            console.log(`\n❌ Errors:`);
            this.results.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }
        
        console.log('\n📝 Next Steps:');
        console.log('1. Update your frontend API configuration with the worker URLs');
        console.log('2. Run the data migration script to populate the database');
        console.log('3. Test the admin dashboard and search functionality');
        console.log('4. Configure your custom domain (optional)');
        
        console.log('\n🎉 Your Cloudflare D1 + Workers solution is ready!');
    }
    
    // Static method to run deployment
    static async deploy() {
        const deployer = new CloudflareDeployer();
        return await deployer.deploy();
    }
    
    // Method to generate deployment summary
    static async generateSummary() {
        console.log('📊 Generating deployment summary...');
        
        try {
            // Get current deployment status
            const databases = execSync('wrangler d1 list', { encoding: 'utf8' });
            const buckets = execSync('wrangler r2 bucket list', { encoding: 'utf8' });
            const workers = execSync('wrangler deployments list', { encoding: 'utf8' });
            
            const summary = {
                timestamp: new Date().toISOString(),
                databases: databases,
                buckets: buckets,
                workers: workers
            };
            
            await fs.writeFile('deployment-summary.json', JSON.stringify(summary, null, 2));
            console.log('✅ Deployment summary saved to deployment-summary.json');
            
            return summary;
            
        } catch (error) {
            console.error('❌ Failed to generate deployment summary:', error.message);
            return null;
        }
    }
}

// Export for use as module
module.exports = CloudflareDeployer;

// Auto-run if called directly
if (require.main === module) {
    CloudflareDeployer.deploy()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 Deployment completed successfully!');
                process.exit(0);
            } else {
                console.error('\n💥 Deployment failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Deployment error:', error);
            process.exit(1);
        });
}