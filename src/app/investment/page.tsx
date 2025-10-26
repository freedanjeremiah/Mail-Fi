"use client";

import React from 'react';
import { InvestmentInterface } from '../components/investment-interface';
import { useSearchParams } from 'next/navigation';

export default function InvestmentPage() {
  const searchParams = useSearchParams();
  
  const projectId = searchParams.get('projectId') || undefined;
  const contractAddress = searchParams.get('contractAddress') || undefined;
  const projectName = searchParams.get('projectName') || undefined;
  const equityOffered = searchParams.get('equityOffered') || undefined;
  const valuation = searchParams.get('valuation') || undefined;
  const minInvestment = searchParams.get('minInvestment') || undefined;
  const maxInvestment = searchParams.get('maxInvestment') || undefined;
  const deadline = searchParams.get('deadline') || undefined;
  const category = searchParams.get('category') || undefined;
  const description = searchParams.get('description') || undefined;
  const correlationId = searchParams.get('correlationId') || undefined;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <InvestmentInterface
        initialProjectId={projectId}
        initialContractAddress={contractAddress}
        initialProjectName={projectName}
        initialEquityOffered={equityOffered}
        initialValuation={valuation}
        initialMinInvestment={minInvestment}
        initialMaxInvestment={maxInvestment}
        initialDeadline={deadline}
        initialCategory={category}
        initialDescription={description}
        initialCorrelationId={correlationId}
      />
    </div>
  );
}
