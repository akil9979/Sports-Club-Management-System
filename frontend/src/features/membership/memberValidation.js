/**
 * Pure JavaScript Member & Membership Validation
 * (Strictly conforming to NO Zod / NO Yup / Pure ES6+ rules)
 */

/**
 * Calculates current age from DOB string 'YYYY-MM-DD'
 */
export function calculateAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validates member registration form data
 */
export function validateMemberRegistration(formData) {
  const errors = {};

  // 1. Required Name
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Full member name is required.';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Member name must be at least 2 characters.';
  } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.name.trim())) {
    errors.name = 'Name contains invalid characters.';
  }

  // 2. Valid DOB
  if (!formData.dob) {
    errors.dob = 'Date of birth is required.';
  } else {
    const dobDate = new Date(formData.dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(dobDate.getTime())) {
      errors.dob = 'Please provide a valid date of birth.';
    } else if (dobDate >= today) {
      errors.dob = 'Date of birth cannot be today or in the future.';
    } else {
      const age = calculateAge(formData.dob);
      if (age < 4) {
        errors.dob = 'Member must be at least 4 years old to enroll.';
      } else if (age > 105) {
        errors.dob = 'Please verify year of birth.';
      }
    }
  }

  // 3. Valid Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(formData.email.trim())) {
    errors.email = 'Please provide a valid email address (e.g. member@example.com).';
  }

  // 4. Valid Phone
  const phoneClean = (formData.phone || '').replace(/[\s\-()]/g, '');
  if (!formData.phone || !formData.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!/^\+?[0-9]{10,15}$/.test(phoneClean)) {
    errors.phone = 'Phone number must contain at least 10 valid digits.';
  }

  // 5. Required Plan Selection
  if (!formData.planId) {
    errors.planId = 'Please select a membership plan (Gold, Silver, or Junior).';
  } else {
    // Junior membership age check
    const planKey = (formData.planId || '').toLowerCase();
    if (planKey.includes('junior')) {
      const age = calculateAge(formData.dob);
      if (age !== null && age >= 18) {
        errors.planId = `Junior membership is strictly reserved for players under 18 years of age (Calculated age: ${age} years). Please choose Silver or Gold plan, or update Date of Birth.`;
      }
    }
  }

  // 6. Prevent obviously invalid date combinations
  if (formData.startDate) {
    const startDateObj = new Date(formData.startDate);
    const minStart = new Date();
    minStart.setDate(minStart.getDate() - 7); // Allow at most 7 days backdate if front desk is recording retroactively
    minStart.setHours(0, 0, 0, 0);

    if (isNaN(startDateObj.getTime())) {
      errors.startDate = 'Invalid membership start date.';
    } else if (startDateObj < minStart) {
      errors.startDate = 'Start date cannot be older than 7 days in the past.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates profile editing
 */
export function validateMemberProfile(updateData) {
  const errors = {};

  if (!updateData.name || !updateData.name.trim()) {
    errors.name = 'Member name cannot be empty.';
  } else if (updateData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!updateData.email || !updateData.email.trim()) {
    errors.email = 'Email address cannot be empty.';
  } else if (!emailRegex.test(updateData.email.trim())) {
    errors.email = 'Invalid email address format.';
  }

  const phoneClean = (updateData.phone || '').replace(/[\s\-()]/g, '');
  if (!updateData.phone || !updateData.phone.trim()) {
    errors.phone = 'Phone number cannot be empty.';
  } else if (!/^\+?[0-9]{10,15}$/.test(phoneClean)) {
    errors.phone = 'Phone number must contain at least 10 digits.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
