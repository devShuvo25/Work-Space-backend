import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ProfileService = {
  /**
   * Fetches the full profile including all relational arrays.
   * Ensure these names match the relation names in your Profile model.
   */
  getProfileData: async (userId: string) => {
    return await prisma.user.findUnique({
      where: { id: userId },
      include : {
        profile: {
            include : {
                portfolios: true,
                testimonials : true,
                education : true,
                certifications : true,
                experience: true     
            }
        }
      }
    });
  },

  /**
   * Updates core user and profile data.
   */
updateProfile: async (userId: string, data: any) => {
  // Destructure name, address, image for the User model
  // Destructure id out of profileFields to prevent trying to update the Primary Key
  const { name, address, image, ...profileFields } = data;
  console.log("Data:",data, "userid :",userId)

  return await prisma.$transaction(async (tx) => {
    // 1. Update User basic info
    await tx.user.update({
      where: { id: userId },
      data: { name, address, image },
    });

    // 2. Upsert the Profile
    // We use 'id' only in 'create' if your DB requires manual IDs, 
    // otherwise, let Prisma/DB handle it.
    return await tx.profile.upsert({
      where: { userId },
      create: { 
        userId, 
        ...profileFields 
      },
      update: profileFields, // This no longer contains 'id' or 'userId'
    });
  });
},
  /**
   * Generic Add: Case-sensitivity matters here. 
   * model parameter should match Prisma model names (e.g., 'portfolio')
   */
  addRelationItem: async (model: string, profileId: string, data: any) => {
    return await (prisma[model as any] as any).create({
      
      data: {
        ...data,
        profileId,
      },
    });
  },

  /**
   * Generic Update
   */
  updateRelationItem: async (model: string, id: string, data: any) => {
    return await (prisma[model as any] as any).update({
      where: { id },
      data,
    });
  },

  /**
   * Generic Delete
   */
  deleteRelationItem: async (model: string, id: string) => {
    return await (prisma[model as any] as any).delete({
      where: { id },
    });
  },

  /**
   * Get all items for a specific section
   */
  getRelationItems: async (model: string, profileId: string) => {
    return await (prisma[model as any] as any).findMany({
      where: { profileId },
      // Optional: Add orderBy if you have createdAt fields
      // orderBy: { createdAt: 'desc' } 
    });
  }
};

// Properly destructuring for export
export const {
  getProfileData,
  updateProfile,
  updateRelationItem,
  getRelationItems,
  deleteRelationItem,
  addRelationItem
} = ProfileService;