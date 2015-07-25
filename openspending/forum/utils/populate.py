# -*- coding: utf-8 -*-
"""
    flaskbb.utils.populate
    ~~~~~~~~~~~~~~~~~~~~

    A module that makes creating data more easily

    :copyright: (c) 2014 by the FlaskBB Team.
    :license: BSD, see LICENSE for more details.
"""
from flaskbb.management.models import Setting, SettingsGroup
from flaskbb.forum.models import Post, Topic, Forum, Category





def create_welcome_forum():
    """This will create the `welcome forum` with a welcome topic.
    Returns True if it's created successfully.
    """

    if User.query.count() < 1:
        return False

    user = User.query.filter_by(id=1).first()

    category = Category(title="My Category", position=1)
    category.save()

    forum = Forum(title="Welcome", description="Your first forum",
                  category_id=category.id)
    forum.save()

    topic = Topic(title="Welcome!")
    post = Post(content="Have fun with your new FlaskBB Forum!")

    topic.save(user=user, forum=forum, post=post)
    return True


def create_test_data(users=5, categories=2, forums=2, topics=1, posts=1):
    """Creates 5 users, 2 categories and 2 forums in each category.
    It also creates a new topic topic in each forum with a post.
    Returns the amount of created users, categories, forums, topics and posts
    as a dict.

    :param users: The number of users.

    :param categories: The number of categories.

    :param forums: The number of forums which are created in each category.

    :param topics: The number of topics which are created in each forum.

    :param posts: The number of posts which are created in each topic.
    """
    create_default_groups()
    create_default_settings()

    data_created = {'users': 0, 'categories': 0, 'forums': 0,
                    'topics': 0, 'posts': 0}

    # create 5 users
    for u in range(1, users + 1):
        username = "test%s" % u
        email = "test%s@example.org" % u
        user = User(username=username, password="test", email=email)
        user.primary_group_id = u
        user.save()
        data_created['users'] += 1

    user1 = User.query.filter_by(id=1).first()
    user2 = User.query.filter_by(id=2).first()

    # lets send them a few private messages
    for i in range(1, 3):
        # TODO
        pass

    # create 2 categories
    for i in range(1, categories + 1):
        category_title = "Test Category %s" % i
        category = Category(title=category_title,
                            description="Test Description")
        category.save()
        data_created['categories'] += 1

        # create 2 forums in each category
        for j in range(1, forums + 1):
            if i == 2:
                j += 2

            forum_title = "Test Forum %s %s" % (j, i)
            forum = Forum(title=forum_title, description="Test Description",
                          category_id=i)
            forum.save()
            data_created['forums'] += 1

            for t in range(1, topics + 1):
                # create a topic
                topic = Topic()
                post = Post()

                topic.title = "Test Title %s" % j
                post.content = "Test Content"
                topic.save(post=post, user=user1, forum=forum)
                data_created['topics'] += 1

                for p in range(1, posts + 1):
                    # create a second post in the forum
                    post = Post()
                    post.content = "Test Post"
                    post.save(user=user2, topic=topic)
                    data_created['posts'] += 1

    return data_created
