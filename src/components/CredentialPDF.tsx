"use client"

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  welcomeSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#4F46E5',
    marginTop: 4,
  },
  credentialsBox: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0D9488',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 80,
    fontSize: 11,
    color: '#666',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 12,
    color: '#111',
    fontFamily: 'Courier',
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 4,
  },
  instructions: {
    marginTop: 10,
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 10,
    color: '#555',
    lineHeight: 1.5,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#999',
  }
})

interface CredentialPDFProps {
  name: string
  email: string
  password: string
  projectName?: string
}

export const CredentialPDF = ({ name, email, password, projectName }: CredentialPDFProps) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>NirmaN</Text>
        <Text style={styles.subtitle}>Construction Transparency Platform</Text>
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome to the project{projectName ? ` "${projectName}"` : ""}.</Text>
        <Text style={styles.name}>{name}</Text>
      </View>

      <View style={styles.credentialsBox}>
        <Text style={styles.boxTitle}>Your Temporary Login Credentials</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Password:</Text>
          <Text style={styles.value}>{password}</Text>
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to Login:</Text>
        <Text style={styles.instructionText}>1. Visit the platform login page.</Text>
        <Text style={styles.instructionText}>2. Enter the email and temporary password provided above.</Text>
        <Text style={styles.instructionText}>3. You will be prompted to set a new secure password upon your first login.</Text>
        <Text style={styles.instructionText}>4. Keep these credentials confidential until your first login.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Automated Credential Slip — Generated on {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
)
