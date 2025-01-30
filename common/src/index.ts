import z from "zod";

export const signupInput = z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string().optional(),
    password: z.string().min(8),
});

export const signinInput = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const createPostInput = z.object({
    content: z.string(),
    title: z.string(),
});

export const editPostInput = z.object({
    content: z.string(),
    title: z.string(),
    id: z.string(),
});

export type SignupInputType = z.infer<typeof signupInput>;
export type SigninInputType = z.infer<typeof signinInput>;
export type CreatePostInputType = z.infer<typeof createPostInput>;
export type EditPostInputType = z.infer<typeof editPostInput>;
