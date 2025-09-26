export const validateContractStatus = (
  from: string,
  to: string,
  role: string,
) => {
  if (role === 'internal') {
    if (from === 'Draft' && to === 'Legal Review') return true;
    else if (from === to && from === 'Draft') return true;
    else if (from === to && from === 'Rejected') return true;
    else return false;
  }
  if (role === 'legal') {
    if (from === 'Legal Review' && to === 'Management Review') return true;
    else if (from === to && from === 'Legal Review') return true;
    else return false;
  }
  if (role === 'management') {
    if (
      from === 'Management Review' &&
      (to === 'Accepted' || to === 'Rejected' || to === 'Legal Review')
    )
      return true;
    else if (from === to && from === 'Management Review') return true;
    else return false;
  }
};
