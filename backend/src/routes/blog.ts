import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import {
    createPostInput,
    editPostInput,
} from "@shivtiwari/serverless-blog-common";
import { Hono } from "hono";
import { verify } from "hono/jwt";

const app = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    };
    Variables: {
        userId: string;
    };
}>();

app.use("/*", async (c, next) => {
    const header = c.req.header("Authorization") || "";
    const token = header.split(" ")[1];
    try {
        const response = await verify(token, c.env.JWT_SECRET);
        if (response.id) {
            c.set("userId", response.id.toString());
            await next();
        } else {
            c.status(403);
            return c.json({ message: "unauthorized" });
        }
    } catch (e) {
        return c.json({ message: "unauthorized" });
    }
});

app.post("/", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const { success } = createPostInput.safeParse(body);

    if (!success) {
        c.status(400);
        return c.json({
            msg: "invalid post schema",
        });
    }

    const post = await prisma.post.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: c.get("userId"),
        },
    });

    return c.json({
        postId: post.id,
    });
});

app.put("/", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const { success } = editPostInput.safeParse(body);

    if (!success) {
        c.status(400);
        return c.json({
            msg: "invalid edit post schema",
        });
    }

    const post = await prisma.post.update({
        where: {
            id: body.id,
        },
        data: {
            title: body.title,
            content: body.content,
        },
    });

    return c.json({
        postId: post.id,
    });
});

app.get("/:id", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const id = c.req.param("id");

    try {
        const post = await prisma.post.findUnique({
            where: {
                id,
            },
        });
        if (post) {
            return c.json({
                id: post.id,
                title: post.title,
                content: post.content,
            });
        } else {
            return c.json({
                message: "some error occurred",
            });
        }
    } catch (e) {
        return c.json({
            message: "post not found",
        });
    }
});

app.get("/", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const allPosts = await prisma.post.findMany();

    return c.json({
        allPosts,
    });
});

export default app;
