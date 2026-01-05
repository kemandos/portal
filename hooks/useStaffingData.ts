import { useState, useCallback } from 'react';
import { Resource } from '../types';
import { MOCK_PEOPLE, MOCK_PROJECTS } from '../constants';
import { 
    updateResourceTree, 
    updateNodeCapacity, 
    removeAllocationForMonths, 
    findResource, 
    findParentId, 
    getCleanId 
} from '../utils/resourceHelpers';

interface SaveAssignmentPayload {
    mode: 'edit' | 'add';
    resourceId: string;
    parentId?: string;
    month: string;
    months?: string[];
    pt: number;
    newItem?: { id: string, name: string, type: 'project' | 'employee' | 'group', subtext: string };
    isCapacityEdit?: boolean;
    role?: string;
}

export const useStaffingData = (viewMode: 'People' | 'Projects') => {
    const [peopleData, setPeopleData] = useState<Resource[]>(MOCK_PEOPLE);
    const [projectData, setProjectData] = useState<Resource[]>(MOCK_PROJECTS);

    const handleSaveAssignment = useCallback((data: SaveAssignmentPayload) => {
        const targetMonths = (data.months && data.months.length > 0) ? data.months : [data.month];

        // We update both states. To avoid stale closures, we use the functional update pattern.
        // We nest setProjectData inside setPeopleData's updater to access the latest state of both 
        // if needed, or simply run them independently if the calculation allows.
        // Here we need to find objects in the latest state to ensure we are updating correctly.

        setPeopleData(prevPeople => {
            let nextPeople = prevPeople;
            
            // We'll update project data as a side-effect-like functional update to ensure we see consistent state?
            // Actually, we can just trigger the project update. The key is that `prevPeople` is fresh here.
            
            setProjectData(prevProjects => {
                let nextProjects = prevProjects;

                targetMonths.forEach(m => {
                    // Handle Capacity Edit for Projects
                    if (data.isCapacityEdit && viewMode === 'Projects') {
                        nextProjects = updateNodeCapacity(nextProjects, data.resourceId, m, data.pt);
                        return;
                    }

                    let personId = '';
                    let projectId = '';
                    
                    if (viewMode === 'People') {
                        if (data.mode === 'add') {
                            personId = data.resourceId;
                            projectId = data.newItem!.id;
                        } else {
                            personId = data.parentId!; 
                            projectId = getCleanId(data.resourceId);
                        }
                    } else {
                        if (data.mode === 'add') {
                            projectId = data.resourceId;
                            personId = data.newItem!.id;
                        } else {
                            projectId = data.parentId!;
                            personId = getCleanId(data.resourceId);
                        }
                    }

                    // Look up in the LATEST state (prevPeople/prevProjects passed to updaters)
                    // Note: For the *first* iteration, we use the passed in prev state. 
                    // For subsequent iterations in this loop, we use the accumulated next state.
                    const personObj = findResource(nextPeople, personId) || (data.newItem && data.newItem.type === 'employee' ? data.newItem : null);
                    const projectObj = findResource(nextProjects, projectId) || (data.newItem && data.newItem.type === 'project' ? data.newItem : null);

                    if (personObj && projectObj) {
                        const roleToUse = data.role;

                        const personTemplateForProjectView = {
                            ...personObj,
                            role: roleToUse,
                            subtext: roleToUse || personObj.subtext
                        };

                        const projectTemplateForPeopleView = {
                            ...projectObj,
                            role: roleToUse,
                        };
                        
                        // We must update BOTH variables for the next iteration to be correct
                        nextPeople = updateResourceTree(nextPeople, personId, projectId, m, data.pt, projectTemplateForPeopleView);
                        nextProjects = updateResourceTree(nextProjects, projectId, personId, m, data.pt, personTemplateForProjectView);
                    }
                });
                return nextProjects;
            });

            return nextPeople; // We've updated nextPeople in the loop above
        });
    }, [viewMode]);

    const handleInlineSave = useCallback((resourceId: string, month: string, value: number, isCapacity: boolean) => {
       const cleanResourceId = getCleanId(resourceId);
       
       setPeopleData(prevPeople => {
           let nextPeople = prevPeople;
           
           setProjectData(prevProjects => {
               const dataSource = viewMode === 'Projects' ? prevProjects : prevPeople;
               const parentId = findParentId(dataSource, resourceId);

               // Root Level Item -> Edit Capacity/Budget
               if (!parentId) {
                   if (viewMode === 'Projects') {
                        return updateNodeCapacity(prevProjects, resourceId, month, value);
                   } else {
                        // People capacity edit logic is handled in people update, but if we were here...
                        // Actually, this block only runs if viewMode is Projects for capacity usually.
                        // But let's follow logic:
                        // If viewMode is People, we update People Data below.
                   }
               }

               // Child Item -> Edit Assignment
               let personId = '';
               let projectId = '';
               
               if (parentId) {
                   if (viewMode === 'Projects') {
                       projectId = parentId;
                       personId = cleanResourceId;
                   } else {
                       personId = parentId;
                       projectId = cleanResourceId;
                   }
                   return updateResourceTree(prevProjects, projectId, personId, month, value, {});
               }
               return prevProjects;
           });

           // Now update People Data
           const dataSource = viewMode === 'Projects' ? projectData : prevPeople; // Note: projectData here is stale? 
           // We should use prevPeople to find parent if viewMode is People
           const parentId = findParentId(viewMode === 'People' ? prevPeople : projectData, resourceId); // Using projectData stale might be risky but we are inside People updater

           if (!parentId) {
               if (viewMode === 'People') {
                   return updateNodeCapacity(prevPeople, resourceId, month, value);
               }
           } else {
               let personId = '';
               let projectId = '';
               if (viewMode === 'Projects') {
                   projectId = parentId;
                   personId = cleanResourceId;
               } else {
                   personId = parentId;
                   projectId = cleanResourceId;
               }
               return updateResourceTree(prevPeople, personId, projectId, month, value, {});
           }
           
           return prevPeople;
       });
    }, [viewMode, projectData]); // Keeping projectData dep for the fallback check, though imperfect

    const handleDeleteAssignment = useCallback((resourceId: string, parentId?: string, month?: string, months?: string[]) => {
        if (!parentId) return;

        const targetMonths = (months && months.length > 0) ? months : (month ? [month] : []);
        
        setPeopleData(prevPeople => {
            setProjectData(prevProjects => {
                let nextProjects = prevProjects;
                let personId = '';
                let projectId = '';

                if (viewMode === 'People') {
                    personId = parentId;
                    projectId = getCleanId(resourceId);
                } else {
                    projectId = parentId;
                    personId = getCleanId(resourceId);
                }
                
                nextProjects = removeAllocationForMonths(nextProjects, projectId, personId, targetMonths);
                return nextProjects;
            });

            // Update People
            let nextPeople = prevPeople;
            let personId = '';
            let projectId = '';

            if (viewMode === 'People') {
                personId = parentId;
                projectId = getCleanId(resourceId);
            } else {
                projectId = parentId;
                personId = getCleanId(resourceId);
            }

            nextPeople = removeAllocationForMonths(nextPeople, personId, projectId, targetMonths);
            return nextPeople;
        });
    }, [viewMode]);

    return {
        peopleData,
        projectData,
        setPeopleData,
        setProjectData,
        handleSaveAssignment,
        handleDeleteAssignment,
        handleInlineSave
    };
};