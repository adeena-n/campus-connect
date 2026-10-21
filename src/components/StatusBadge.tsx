import React from 'react';
import { GigStatus, ApplicationStatus, PaymentType, GigType } from '../types.ts';

export const GigStatusBadge: React.FC<{ status: GigStatus }> = ({ status }) => {
  switch (status) {
    case 'Open':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#18392B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#18392B]"></span>
          <span>Open</span>
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#72766F]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A0]"></span>
          <span>In Progress</span>
        </span>
      );
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#18392B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A0]"></span>
          <span>Completed</span>
        </span>
      );
    case 'Expired':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C77755]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C77755]"></span>
          <span>Expired</span>
        </span>
      );
    case 'Cancelled':
      return (
        <span className="text-xs font-medium text-[#72766F] line-through">
          Cancelled
        </span>
      );
    default:
      return null;
  }
};

export const ApplicationStatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#72766F]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A0]"></span>
          <span>Pending Review</span>
        </span>
      );
    case 'Accepted':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18392B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#18392B]"></span>
          <span>Accepted</span>
        </span>
      );
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C77755]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C77755]"></span>
          <span>Declined</span>
        </span>
      );
    default:
      return null;
  }
};

export const PaymentBadge: React.FC<{ payment_type: PaymentType; budget?: number | null }> = ({
  payment_type,
  budget
}) => {
  if (payment_type === 'Paid') {
    return (
      <span className="text-xs font-semibold text-[#18392B] tabular-nums">
        ${budget !== null && budget !== undefined ? budget.toLocaleString() : 'Negotiable'}
      </span>
    );
  }
  if (payment_type === 'SkillSwap') {
    return (
      <span className="text-xs font-medium text-[#202820]">
        SkillSwap
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-[#72766F]">
      Free Peer Support
    </span>
  );
};

export const GigTypeBadge: React.FC<{ type: GigType }> = ({ type }) => {
  if (type === 'Offering') {
    return (
      <span className="text-xs font-medium text-[#18392B]">
        Offering
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-[#C77755]">
      Requesting
    </span>
  );
};
