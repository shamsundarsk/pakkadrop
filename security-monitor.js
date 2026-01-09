#!/usr/bin/env node

/**
 * Enhanced Security Monitoring Script
 * Provides real-time security monitoring and alerting
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class SecurityMonitor {
  constructor() {
    this.alerts = []
    this.securityScore = 100
    this.lastScan = null
  }

  // Check for new vulnerabilities
  async checkVulnerabilities() {
    console.log('🔍 Scanning for vulnerabilities...')
    
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' })
      const audit = JSON.parse(auditResult)
      
      const vulns = audit.metadata?.vulnerabilities || {}
      const critical = vulns.critical || 0
      const high = vulns.high || 0
      const moderate = vulns.moderate || 0
      const low = vulns.low || 0
      
      if (critical > 0) {
        this.addAlert('CRITICAL', `${critical} critical vulnerabilities found`, 'immediate')
        this.securityScore -= (critical * 30)
      }
      
      if (high > 0) {
        this.addAlert('HIGH', `${high} high severity vulnerabilities found`, 'urgent')
        this.securityScore -= (high * 20)
      }
      
      if (moderate > 2) {
        this.addAlert('MEDIUM', `${moderate} moderate vulnerabilities found`, 'review')
        this.securityScore -= ((moderate - 2) * 5)
      }
      
      return { critical, high, moderate, low }
      
    } catch (error) {
      // If npm audit fails, try to get basic info
      try {
        execSync('npm audit', { stdio: 'pipe' })
        return { critical: 0, high: 0, moderate: 0, low: 0 }
      } catch (e) {
        // Parse error output for vulnerability count
        const output = e.stdout?.toString() || e.stderr?.toString() || ''
        const criticalMatch = output.match(/(\d+) critical/)
        const highMatch = output.match(/(\d+) high/)
        const moderateMatch = output.match(/(\d+) moderate/)
        
        return {
          critical: criticalMatch ? parseInt(criticalMatch[1]) : 0,
          high: highMatch ? parseInt(highMatch[1]) : 0,
          moderate: moderateMatch ? parseInt(moderateMatch[1]) : 0,
          low: 0
        }
      }
    }
  }

  // Check for outdated packages
  async checkOutdatedPackages() {
    console.log('📦 Checking for outdated packages...')
    
    try {
      const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' })
      const outdated = JSON.parse(outdatedResult)
      
      const criticalPackages = ['express', 'helmet', 'jsonwebtoken', 'bcryptjs', 'argon2']
      const securityPackages = Object.keys(outdated).filter(pkg => 
        criticalPackages.includes(pkg) || pkg.includes('security') || pkg.includes('auth')
      )
      
      if (securityPackages.length > 0) {
        this.addAlert('MEDIUM', `Security-related packages outdated: ${securityPackages.join(', ')}`, 'review')
        this.securityScore -= (securityPackages.length * 5)
      }
      
      return Object.keys(outdated).length
      
    } catch (error) {
      return 0 // No outdated packages or error
    }
  }

  // Check security configuration
  async checkSecurityConfig() {
    console.log('⚙️  Checking security configuration...')
    
    const issues = []
    
    // Check environment variables
    try {
      const envExample = fs.readFileSync('.env.example', 'utf8')
      const requiredSecurityVars = [
        'JWT_SECRET',
        'ENCRYPTION_KEY',
        'DATABASE_URL',
        'ALLOWED_ORIGINS'
      ]
      
      for (const envVar of requiredSecurityVars) {
        if (!envExample.includes(envVar)) {
          issues.push(`Missing ${envVar} in .env.example`)
        }
      }
    } catch (error) {
      issues.push('Cannot read .env.example file')
    }
    
    // Check security middleware
    try {
      const securityFile = fs.readFileSync('server/middleware/security.js', 'utf8')
      
      const requiredMiddleware = [
        'helmet',
        'express-rate-limit',
        'express-validator',
        'hpp'
      ]
      
      for (const middleware of requiredMiddleware) {
        if (!securityFile.includes(middleware)) {
          issues.push(`Missing ${middleware} middleware`)
        }
      }
      
      // Check for dangerous patterns
      if (securityFile.includes('express-brute')) {
        issues.push('Vulnerable express-brute still referenced')
      }
      
    } catch (error) {
      issues.push('Cannot read security middleware file')
    }
    
    if (issues.length > 0) {
      this.addAlert('MEDIUM', `Security configuration issues: ${issues.length}`, 'review')
      this.securityScore -= (issues.length * 3)
    }
    
    return issues
  }

  // Check for suspicious files
  async checkSuspiciousFiles() {
    console.log('🕵️  Checking for suspicious files...')
    
    const suspiciousPatterns = [
      '*.bak',
      '*.tmp',
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      'core.*',
      '*.swp'
    ]
    
    const suspiciousFiles = []
    
    try {
      for (const pattern of suspiciousPatterns) {
        try {
          const files = execSync(`find . -name "${pattern}" -not -path "./node_modules/*" -not -path "./.git/*"`, { encoding: 'utf8' }).trim()
          if (files) {
            suspiciousFiles.push(...files.split('\n'))
          }
        } catch (error) {
          // Pattern not found, continue
        }
      }
      
      if (suspiciousFiles.length > 0) {
        this.addAlert('LOW', `Suspicious files found: ${suspiciousFiles.length}`, 'cleanup')
        this.securityScore -= (suspiciousFiles.length * 1)
      }
      
    } catch (error) {
      // Ignore errors in file scanning
    }
    
    return suspiciousFiles
  }

  // Check log files for security events
  async checkSecurityLogs() {
    console.log('📋 Checking security logs...')
    
    const logFiles = ['logs/error.log', 'logs/audit.log']
    const securityEvents = []
    
    for (const logFile of logFiles) {
      try {
        if (fs.existsSync(logFile)) {
          const logContent = fs.readFileSync(logFile, 'utf8')
          const lines = logContent.split('\n').slice(-100) // Last 100 lines
          
          const suspiciousPatterns = [
            /failed.*login/i,
            /rate.*limit/i,
            /suspicious.*activity/i,
            /security.*event/i,
            /unauthorized/i,
            /forbidden/i
          ]
          
          for (const line of lines) {
            for (const pattern of suspiciousPatterns) {
              if (pattern.test(line)) {
                securityEvents.push(line.trim())
                break
              }
            }
          }
        }
      } catch (error) {
        // Log file not readable
      }
    }
    
    if (securityEvents.length > 10) {
      this.addAlert('HIGH', `High number of security events: ${securityEvents.length}`, 'investigate')
      this.securityScore -= 10
    } else if (securityEvents.length > 5) {
      this.addAlert('MEDIUM', `Security events detected: ${securityEvents.length}`, 'monitor')
      this.securityScore -= 5
    }
    
    return securityEvents.slice(-10) // Return last 10 events
  }

  // Add alert
  addAlert(severity, message, action) {
    this.alerts.push({
      severity,
      message,
      action,
      timestamp: new Date().toISOString()
    })
  }

  // Generate security report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      securityScore: Math.max(0, this.securityScore),
      alerts: this.alerts,
      recommendations: this.generateRecommendations()
    }
    
    return report
  }

  // Generate recommendations based on alerts
  generateRecommendations() {
    const recommendations = []
    
    const criticalAlerts = this.alerts.filter(a => a.severity === 'CRITICAL')
    const highAlerts = this.alerts.filter(a => a.severity === 'HIGH')
    const mediumAlerts = this.alerts.filter(a => a.severity === 'MEDIUM')
    
    if (criticalAlerts.length > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Fix critical vulnerabilities immediately',
        details: 'Run npm audit fix and update vulnerable packages'
      })
    }
    
    if (highAlerts.length > 0) {
      recommendations.push({
        priority: 'URGENT',
        action: 'Address high severity issues within 24 hours',
        details: 'Review security logs and update configurations'
      })
    }
    
    if (mediumAlerts.length > 3) {
      recommendations.push({
        priority: 'SCHEDULED',
        action: 'Schedule maintenance window for updates',
        details: 'Plan package updates and security improvements'
      })
    }
    
    if (this.securityScore < 80) {
      recommendations.push({
        priority: 'REVIEW',
        action: 'Comprehensive security review needed',
        details: 'Security score below acceptable threshold'
      })
    }
    
    return recommendations
  }

  // Run complete security scan
  async runScan() {
    console.log('🔒 Starting Security Monitoring Scan')
    console.log('====================================\n')
    
    this.alerts = []
    this.securityScore = 100
    this.lastScan = new Date().toISOString()
    
    const results = {}
    
    results.vulnerabilities = await this.checkVulnerabilities()
    results.outdatedPackages = await this.checkOutdatedPackages()
    results.configIssues = await this.checkSecurityConfig()
    results.suspiciousFiles = await this.checkSuspiciousFiles()
    results.securityEvents = await this.checkSecurityLogs()
    
    const report = this.generateReport()
    
    // Display results
    console.log('\n🔒 Security Monitoring Report')
    console.log('=============================')
    console.log(`Scan Time: ${report.timestamp}`)
    console.log(`Security Score: ${report.securityScore}/100`)
    
    if (report.securityScore >= 90) {
      console.log('✅ Excellent security posture')
    } else if (report.securityScore >= 80) {
      console.log('⚠️  Good security posture with minor issues')
    } else if (report.securityScore >= 70) {
      console.log('⚠️  Moderate security concerns')
    } else {
      console.log('❌ Significant security issues detected')
    }
    
    console.log('\n📊 Scan Results:')
    console.log(`- Vulnerabilities: ${results.vulnerabilities.critical}C/${results.vulnerabilities.high}H/${results.vulnerabilities.moderate}M`)
    console.log(`- Outdated packages: ${results.outdatedPackages}`)
    console.log(`- Config issues: ${results.configIssues.length}`)
    console.log(`- Suspicious files: ${results.suspiciousFiles.length}`)
    console.log(`- Security events: ${results.securityEvents.length}`)
    
    if (report.alerts.length > 0) {
      console.log('\n🚨 Alerts:')
      for (const alert of report.alerts) {
        const icon = alert.severity === 'CRITICAL' ? '🔴' : 
                    alert.severity === 'HIGH' ? '🟠' : 
                    alert.severity === 'MEDIUM' ? '🟡' : '🔵'
        console.log(`   ${icon} ${alert.severity}: ${alert.message}`)
      }
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      for (const rec of report.recommendations) {
        console.log(`   ${rec.priority}: ${rec.action}`)
        console.log(`      ${rec.details}`)
      }
    }
    
    // Save report
    fs.writeFileSync('security-report.json', JSON.stringify(report, null, 2))
    console.log('\n📄 Detailed report saved to security-report.json')
    
    return report
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new SecurityMonitor()
  monitor.runScan().then(report => {
    process.exit(report.securityScore >= 80 ? 0 : 1)
  }).catch(error => {
    console.error('Security scan failed:', error)
    process.exit(1)
  })
}

module.exports = SecurityMonitor