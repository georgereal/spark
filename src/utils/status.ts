/**
 * Get color for payment status
 * @param status - The status string
 * @returns Hex color code for the status
 */
export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'mapped':
      return '#4CAF50';
    case 'pending':
      return '#FF9800';
    case 'failed':
    case 'unmapped':
      return '#F44336';
    case 'cancelled':
      return '#9E9E9E';
    case 'processing':
    case 'bank_linked':
      return '#2196F3';
    default:
      return '#9E9E9E';
  }
};

/**
 * Get icon name for payment status
 * @param status - The status string
 * @returns Ionicons name for the status
 */
export const getStatusIcon = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'mapped':
      return 'checkmark-circle';
    case 'pending':
      return 'time';
    case 'failed':
    case 'unmapped':
      return 'close-circle';
    case 'cancelled':
      return 'ban';
    case 'processing':
    case 'bank_linked':
      return 'refresh-circle';
    default:
      return 'help-circle';
  }
};

/**
 * Get color for payment method
 * @param method - The payment method string
 * @returns Hex color code for the method
 */
export const getMethodColor = (method: string): string => {
  switch (method?.toLowerCase()) {
    case 'cash':
      return '#4CAF50';
    case 'card':
      return '#2196F3';
    case 'upi':
      return '#9C27B0';
    case 'netbanking':
      return '#FF9800';
    case 'cheque':
      return '#607D8B';
    default:
      return '#9E9E9E';
  }
};

/**
 * Get icon name for payment method
 * @param method - The payment method string
 * @returns Ionicons name for the method
 */
export const getMethodIcon = (method: string): string => {
  switch (method?.toLowerCase()) {
    case 'cash':
      return 'cash';
    case 'card':
      return 'card';
    case 'upi':
      return 'phone-portrait';
    case 'netbanking':
      return 'business';
    case 'cheque':
      return 'document-text';
    default:
      return 'help-circle';
  }
};
